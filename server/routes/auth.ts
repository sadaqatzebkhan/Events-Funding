import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Database } from '../db.js';
import { generateToken, authenticate, AuthRequest } from '../auth.js';

const router = express.Router();
const db = Database.getInstance();

// Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
      res.status(400).json({ error: 'Username (or phone) and password are required.' });
      return;
    }

    const matchingUsers = await db.findUsersByIdentifier(username);
    if (!matchingUsers || matchingUsers.length === 0) {
      res.status(401).json({ error: 'Invalid login credentials. User not found.' });
      return;
    }

    // Find the user whose password matches among the candidates
    let authenticatedUser = matchingUsers.find((u) => u.active && bcrypt.compareSync(password, u.passwordHash));

    if (!authenticatedUser) {
      // Check if any matching account was deactivated
      const inactive = matchingUsers.find((u) => !u.active && bcrypt.compareSync(password, u.passwordHash));
      if (inactive) {
        res.status(403).json({ error: 'This account has been deactivated. Please contact the family Admin.' });
        return;
      }
      res.status(401).json({ error: 'Incorrect password. Please try again.' });
      return;
    }

    const token = generateToken(authenticatedUser);
    const { passwordHash: _, ...safeUser } = authenticatedUser;

    res.json({
      token,
      user: safeUser,
      message: `Welcome back, ${authenticatedUser.name}!`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Get current authenticated user
router.get('/me', authenticate, (req: AuthRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { passwordHash: _, ...safeUser } = req.user;
  res.json({ user: safeUser });
});

// Update own profile
router.put('/profile', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { name, fatherName, address, phone, whatsapp } = req.body;

    if (!name?.trim()) {
      res.status(400).json({ error: 'Full Name is required.' });
      return;
    }

    const updated = await db.updateUser(req.user.id, {
      name: name.trim(),
      fatherName: fatherName ? fatherName.trim() : req.user.fatherName,
      address: address ? address.trim() : req.user.address,
      phone: phone ? phone.trim() : req.user.phone,
      whatsapp: whatsapp ? whatsapp.trim() : req.user.whatsapp,
    });

    if (!updated) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { passwordHash: _, ...safeUser } = updated;
    res.json({ user: safeUser, message: 'Profile updated successfully!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update profile' });
  }
});

// Change own password
router.post('/change-password', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      res.status(400).json({ error: 'All password fields are required.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({ error: 'New password and confirmation do not match.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      return;
    }

    const isMatch = bcrypt.compareSync(currentPassword, req.user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    await db.updateUser(req.user.id, { passwordHash: newHash });

    res.json({ message: 'Password changed successfully!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to change password' });
  }
});

// Demo accounts for quick test logins.
// SECURITY: only ever exposed outside production, and never includes credentials —
// this used to return a guessed `samplePassword` for every account (including admin)
// to any unauthenticated caller, which is a full authentication bypass.
router.get('/demo-users', async (_req: Request, res: Response): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const users = await db.getAllUsers();
  const demoList = users
    .filter((u) => u.active)
    .map((u) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
    }));
  res.json({ demoUsers: demoList });
});

export default router;
