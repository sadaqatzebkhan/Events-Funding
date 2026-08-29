import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import { Database } from '../db.js';
import { authenticate, requireAdmin, AuthRequest } from '../auth.js';

const router = express.Router();
const db = Database.getInstance();

// GET /api/members - List all members
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search } = req.query;
    let users = await db.getAllUsers();

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.fatherName.toLowerCase().includes(q) ||
          u.phone.includes(q) ||
          u.username.toLowerCase().includes(q)
      );
    }

    const membersWithStats = await Promise.all(
      users.map(async (u) => {
        const history = await db.getMemberPaymentHistory(u.id);
        const totalPending = history.reduce((sum, h) => sum + h.paymentRecord.pendingAmount, 0);
        const totalPaid = history.reduce((sum, h) => sum + h.paymentRecord.paidAmount, 0);
        const totalEvents = history.length;
        const paidEvents = history.filter((h) => h.paymentRecord.status === 'paid').length;
        const partialEvents = history.filter((h) => h.paymentRecord.status === 'partial').length;
        const unpaidEvents = history.filter((h) => h.paymentRecord.status === 'unpaid').length;

        const { passwordHash: _, ...safeUser } = u;
        return {
          ...safeUser,
          totalPending,
          totalPaid,
          totalEvents,
          paidEvents,
          partialEvents,
          unpaidEvents,
        };
      })
    );

    res.json({ members: membersWithStats });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch members' });
  }
});

// POST /api/members - Add new member (Admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, fatherName, address, phone, whatsapp, username, password, role } = req.body;

    if (!name?.trim()) {
      res.status(400).json({ error: 'Full Name is required.' });
      return;
    }

    if (!phone?.trim()) {
      res.status(400).json({ error: 'Phone number is required.' });
      return;
    }

    // Allow duplicate names, father names, and shared contact numbers (e.g. family brothers)
    let userHandle = (username?.trim() || '').toLowerCase();
    if (!userHandle) {
      const baseSlug = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15) || 'member';
      let candidate = baseSlug;
      let counter = 1;
      while (await db.findUserByUsername(candidate)) {
        candidate = `${baseSlug}_${counter++}`;
      }
      userHandle = candidate;
    } else {
      const existing = await db.findUserByUsername(userHandle);
      if (existing) {
        res.status(400).json({ error: 'This login username is already taken. Please choose a different username.' });
        return;
      }
    }

    const plainPassword = password?.trim() || 'family123';
    if (plainPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }
    const passwordHash = bcrypt.hashSync(plainPassword, 10);

    const newUser = await db.addUser({
      username: userHandle.toLowerCase(),
      passwordHash,
      name: name.trim(),
      fatherName: fatherName ? fatherName.trim() : '',
      address: address ? address.trim() : '',
      phone: phone.trim(),
      whatsapp: whatsapp ? whatsapp.trim() : phone.trim(),
      role: role === 'admin' ? 'admin' : role === 'viewer' ? 'viewer' : 'member',
      active: true,
    });

    const { passwordHash: _, ...safeUser } = newUser;
    res.status(201).json({
      member: safeUser,
      message: `Family member ${newUser.name} added successfully! (Username: ${userHandle}, Default Password: ${plainPassword})`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to add member' });
  }
});

// GET /api/members/:id - Member details & event-wise history
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.params.id;
    const user = await db.findUserById(memberId);

    if (!user) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }

    const history = await db.getMemberPaymentHistory(memberId);
    const totalPending = history.reduce((sum, h) => sum + h.paymentRecord.pendingAmount, 0);
    const totalPaid = history.reduce((sum, h) => sum + h.paymentRecord.paidAmount, 0);
    const totalEvents = history.length;
    const paidEvents = history.filter((h) => h.paymentRecord.status === 'paid').length;
    const partialEvents = history.filter((h) => h.paymentRecord.status === 'partial').length;
    const unpaidEvents = history.filter((h) => h.paymentRecord.status === 'unpaid').length;

    const { passwordHash: _, ...safeUser } = user;

    res.json({
      member: safeUser,
      summary: {
        totalEvents,
        paidEvents,
        partialEvents,
        unpaidEvents,
        totalPaid,
        totalPending,
      },
      history,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch member details' });
  }
});

// PUT /api/members/:id - Update member details (Admin or Self)
router.put('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.params.id;
    const isSelf = req.user!.id === memberId;
    const isAdmin = req.user!.role === 'admin';

    if (!isAdmin && !isSelf) {
      res.status(403).json({ error: 'You do not have permission to edit this member.' });
      return;
    }

    const existing = await db.findUserById(memberId);
    if (!existing) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }

    const { name, fatherName, address, phone, whatsapp, role, active } = req.body;

    if (!name?.trim()) {
      res.status(400).json({ error: 'Full Name is required.' });
      return;
    }

    if (phone !== undefined && !phone?.trim()) {
      res.status(400).json({ error: 'Phone number cannot be empty.' });
      return;
    }

    // Preserve existing values for any field the caller omitted — a partial payload
    // (e.g. a form that doesn't collect every field) must never blank out data that
    // wasn't submitted.
    const updates: any = {
      name: name.trim(),
      fatherName: fatherName !== undefined ? fatherName.trim() : existing.fatherName,
      address: address !== undefined ? address.trim() : existing.address,
      phone: phone !== undefined ? phone.trim() : existing.phone,
      whatsapp: whatsapp !== undefined ? whatsapp.trim() : existing.whatsapp,
    };

    // Only admin can change role or active status
    if (isAdmin) {
      if (role && (role === 'admin' || role === 'member' || role === 'viewer')) {
        updates.role = role;
      }
      if (typeof active === 'boolean') {
        updates.active = active;
      }
    }

    const updated = await db.updateUser(memberId, updates);
    if (!updated) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }

    const { passwordHash: _, ...safeUser } = updated;
    res.json({
      member: safeUser,
      message: 'Member information updated successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update member' });
  }
});

// DELETE /api/members/:id - Delete member safely preserving records (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.params.id;

    if (req.user!.id === memberId) {
      res.status(400).json({ error: 'You cannot delete your own admin account.' });
      return;
    }

    const deleted = await db.deleteUser(memberId);
    if (!deleted) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }

    res.json({
      message: 'Member deleted from directory. All past financial records and payment histories are safely preserved.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete member' });
  }
});

export default router;
