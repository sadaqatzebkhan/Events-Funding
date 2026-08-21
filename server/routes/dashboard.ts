import express, { Response } from 'express';
import { Database } from '../db.js';
import { authenticate, AuthRequest } from '../auth.js';

const router = express.Router();
const db = Database.getInstance();

// GET /api/dashboard
router.get('/', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await db.calculateStats();
    const allEvents = await db.getAllEvents();
    const recentEvents = await Promise.all(
      allEvents.slice(0, 5).map(async (e) => {
        const memberPayments = await db.getEventMemberPayments(e.id);
        const totalCollected = memberPayments.reduce((sum, mp) => sum + mp.paidAmount, 0);
        const totalPending = memberPayments.reduce((sum, mp) => sum + mp.pendingAmount, 0);

        return {
          id: e.id,
          name: e.name,
          date: e.date,
          description: e.description,
          requiredAmountPerMember: e.requiredAmountPerMember,
          totalExpense: Number(e.totalExpense) || 0,
          totalCollected,
          totalPending,
          membersCount: memberPayments.length,
        };
      })
    );

    const recentLedger = await db.getRecentLedger(8);

    res.json({
      stats,
      recentEvents,
      recentLedger,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load dashboard data' });
  }
});

export default router;
