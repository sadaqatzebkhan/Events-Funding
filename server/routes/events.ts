import express, { Response } from 'express';
import { Database } from '../db.js';
import { authenticate, requireAdmin, AuthRequest } from '../auth.js';

const router = express.Router();
const db = Database.getInstance();

// GET /api/events - List all events
router.get('/', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const events = await db.getAllEvents();
    const eventList = await Promise.all(
      events.map(async (e) => {
        const payments = await db.getEventMemberPayments(e.id);
        const totalPaid = payments.reduce((sum, p) => sum + p.paidAmount, 0);
        const totalPending = payments.reduce((sum, p) => sum + p.pendingAmount, 0);
        const paidCount = payments.filter((p) => p.status === 'paid').length;
        const partialCount = payments.filter((p) => p.status === 'partial').length;
        const unpaidCount = payments.filter((p) => p.status === 'unpaid').length;

        return {
          ...e,
          totalExpense: Number(e.totalExpense) || 0,
          totalPaid,
          totalPending,
          membersCount: payments.length,
          paidCount,
          partialCount,
          unpaidCount,
        };
      })
    );

    res.json({ events: eventList });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch events' });
  }
});

// POST /api/events - Create new event (Admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, date, requiredAmountPerMember, totalExpense } = req.body;

    if (!name?.trim()) {
      res.status(400).json({ error: 'Event name is required.' });
      return;
    }

    if (!date) {
      res.status(400).json({ error: 'Event date is required.' });
      return;
    }

    const reqAmount = Number(requiredAmountPerMember);
    if (isNaN(reqAmount) || reqAmount < 0) {
      res.status(400).json({ error: 'Required amount per member must be a valid non-negative number.' });
      return;
    }

    const numTotalExpense = totalExpense !== undefined ? Math.max(0, Number(totalExpense) || 0) : 0;

    const event = await db.createEvent({
      name: name.trim(),
      description: description ? description.trim() : '',
      date,
      requiredAmountPerMember: reqAmount,
      totalExpense: numTotalExpense,
      createdBy: req.user!.id,
    });

    res.status(201).json({
      event,
      message: 'Event created successfully and member payment records generated.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create event' });
  }
});

// GET /api/events/notifications/unseen - New events the current member hasn't
// been shown yet (admins never get a list, since only admins create events).
// Registered before /:id so "notifications" is never swallowed as an id param.
router.get('/notifications/unseen', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role === 'admin') {
      res.json({ events: [] });
      return;
    }
    const events = await db.getUnseenEvents(req.user!.id);
    res.json({ events });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch new event notifications' });
  }
});

// POST /api/events/notifications/seen - Dismiss the new-event notification
router.post('/notifications/seen', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await db.markEventsSeen(req.user!.id);
    res.json({ message: 'Notifications marked as seen.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update notification status' });
  }
});

// GET /api/events/:id - Get event details, expenses, member payments
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const eventId = req.params.id;
    const event = await db.findEventById(eventId);

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const memberPayments = await db.getEventMemberPayments(eventId);
    const transactions = await db.getPaymentTransactions(eventId);

    const totalCollected = memberPayments.reduce((sum, p) => sum + p.paidAmount, 0);
    const totalPending = memberPayments.reduce((sum, p) => sum + p.pendingAmount, 0);

    res.json({
      event: {
        ...event,
        totalExpense: Number(event.totalExpense) || 0,
        totalCollected,
        totalPending,
      },
      expenses: [],
      memberPayments,
      transactions,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch event details' });
  }
});

// PUT /api/events/:id - Update event (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const eventId = req.params.id;
    const { name, description, date, requiredAmountPerMember, totalExpense } = req.body;

    if (!name?.trim()) {
      res.status(400).json({ error: 'Event name is required.' });
      return;
    }

    const reqAmount = Number(requiredAmountPerMember);
    if (isNaN(reqAmount) || reqAmount < 0) {
      res.status(400).json({ error: 'Required amount per member must be a non-negative number.' });
      return;
    }

    const numTotalExpense = totalExpense !== undefined ? Math.max(0, Number(totalExpense) || 0) : undefined;

    const updated = await db.updateEvent(eventId, {
      name: name.trim(),
      description: description ? description.trim() : '',
      date,
      requiredAmountPerMember: reqAmount,
      ...(numTotalExpense !== undefined ? { totalExpense: numTotalExpense } : {}),
    });

    if (!updated) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    res.json({
      event: updated,
      message: 'Event updated successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update event' });
  }
});

// DELETE /api/events/:id - Delete event (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const eventId = req.params.id;
    const deleted = await db.deleteEvent(eventId);

    if (!deleted) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    res.json({ message: 'Event and associated records deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete event' });
  }
});

// POST /api/events/:id/expenses - Add an expense (Admin only)
router.post('/:id/expenses', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const eventId = req.params.id;
    const { title, amount, description, date } = req.body;

    if (!title?.trim()) {
      res.status(400).json({ error: 'Expense title is required.' });
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ error: 'Expense amount must be greater than zero.' });
      return;
    }

    const expense = await db.addExpense({
      eventId,
      title: title.trim(),
      amount: numAmount,
      description: description ? description.trim() : '',
      date: date || new Date().toISOString().split('T')[0],
      createdBy: req.user!.id,
    });

    const expenses = await db.getExpensesByEventId(eventId);
    const totalExpense = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

    res.status(201).json({
      expense,
      totalExpense,
      message: 'Expense recorded successfully and deducted from available fund.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to add expense' });
  }
});

// DELETE /api/events/:id/expenses/:expenseId - Delete an expense (Admin only)
router.delete(
  '/:id/expenses/:expenseId',
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id: eventId, expenseId } = req.params;
      const deleted = await db.deleteExpense(expenseId);

      if (!deleted) {
        res.status(404).json({ error: 'Expense not found' });
        return;
      }

      const expenses = await db.getExpensesByEventId(eventId);
      const totalExpense = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

      res.json({
        totalExpense,
        message: 'Expense removed and fund updated.',
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete expense' });
    }
  }
);

// POST /api/events/:id/payments - Record member payment (Admin only)
router.post('/:id/payments', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const eventId = req.params.id;
    const { memberId, amount, date, note } = req.body;

    if (!memberId) {
      res.status(400).json({ error: 'Member is required.' });
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ error: 'Payment amount must be greater than zero.' });
      return;
    }

    const result = await db.recordPayment({
      eventId,
      memberId,
      amount: numAmount,
      date: date || new Date().toISOString().split('T')[0],
      note: note ? note.trim() : undefined,
      recordedBy: req.user!.id,
    });

    const memberPayments = await db.getEventMemberPayments(eventId);
    const availableFund = await db.calculateAvailableFund();

    res.status(201).json({
      paymentRecord: result.paymentRecord,
      transaction: result.transaction,
      memberPayments,
      availableFund,
      message: `Payment of Rs. ${numAmount.toLocaleString()} successfully recorded for ${result.paymentRecord.memberName}!`,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to record payment' });
  }
});

export default router;
