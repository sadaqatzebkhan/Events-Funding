import bcrypt from 'bcryptjs';
import {
  connectToMongoDB,
  UserModel,
  EventModel,
  ExpenseModel,
  EventMemberPaymentModel,
  PaymentTransactionModel,
  LedgerTransactionModel,
  FundMetaModel,
} from './mongodb.js';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  fatherName: string;
  address: string;
  phone: string;
  whatsapp: string;
  role: 'admin' | 'member' | 'viewer';
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastSeenEventAt: string;
}

export interface ExpenseItem {
  id: string;
  eventId: string;
  title: string;
  amount: number;
  description?: string;
  date: string;
  createdBy: string;
  createdAt: string;
}

export interface PaymentTransaction {
  id: string;
  eventId: string;
  memberId: string;
  paymentRecordId: string;
  amount: number;
  date: string;
  note?: string;
  recordedBy: string;
  createdAt: string;
}

export interface EventMemberPayment {
  id: string;
  eventId: string;
  memberId: string;
  memberName: string;
  memberFatherName: string;
  memberPhone: string;
  memberWhatsapp?: string;
  requiredAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: 'paid' | 'partial' | 'unpaid';
  updatedAt: string;
}

export interface EventRecord {
  id: string;
  name: string;
  description: string;
  date: string;
  requiredAmountPerMember: number;
  totalExpense: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerTransaction {
  id: string;
  type: 'initial' | 'payment_in' | 'expense_out';
  amount: number;
  eventId?: string;
  eventName?: string;
  memberId?: string;
  memberName?: string;
  description: string;
  date: string;
  recordedBy: string;
  createdAt: string;
}

// Strips Mongoose-only fields (_id, __v) from a lean() document.
function clean<T>(doc: any): T {
  if (!doc) return doc;
  const { _id, __v, ...rest } = doc;
  return rest as T;
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

async function ensureSeeded(): Promise<void> {
  const userCount = await UserModel.countDocuments();
  if (userCount > 0) return;

  console.log('🌱 No users found — seeding a single admin account...');
  const now = new Date().toISOString();
  await UserModel.create({
    id: 'usr_admin',
    username: 'admin',
    passwordHash: bcrypt.hashSync('admin123', 10),
    name: 'Admin',
    fatherName: '',
    address: '',
    phone: '03001234567',
    whatsapp: '03001234567',
    role: 'admin',
    active: true,
    createdAt: now,
    updatedAt: now,
    lastSeenEventAt: now,
  });
  await FundMetaModel.findOneAndUpdate(
    { key: 'main_fund' },
    { initialFund: 0, updatedAt: now },
    { upsert: true }
  );
  console.log('✅ Seeded admin account (username: admin, password: admin123 — change it after first login).');
}

/**
 * Every read/write goes straight to MongoDB — there is no in-memory cache and
 * no local-file fallback. This app runs on Vercel serverless functions, where
 * the filesystem is read-only/ephemeral and each invocation may land on a
 * different, independent process, so MongoDB has to be the single source of
 * truth for every request.
 */
export class Database {
  private static instance: Database;
  private static readyPromise: Promise<void> | null = null;

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * Ensures the MongoDB connection is established and the admin seed exists.
   * Safe to call on every request — after the first successful call in a
   * given process, this resolves immediately (memoized promise).
   */
  public static async init(): Promise<Database> {
    const db = Database.getInstance();
    if (!Database.readyPromise) {
      Database.readyPromise = (async () => {
        const connected = await connectToMongoDB();
        if (!connected) {
          throw new Error('MongoDB connection failed. Set MONGODB_URI to a reachable MongoDB instance.');
        }
        await ensureSeeded();
      })().catch((err) => {
        // Allow a retry on the next request instead of caching a permanent failure.
        Database.readyPromise = null;
        throw err;
      });
    }
    await Database.readyPromise;
    return db;
  }

  // ---------- Users ----------

  public async findUserById(id: string): Promise<User | undefined> {
    const doc = await UserModel.findOne({ id }).lean();
    return doc ? clean<User>(doc) : undefined;
  }

  public async findUserByUsername(username: string): Promise<User | undefined> {
    const norm = username.trim().toLowerCase();
    const normDigits = norm.replace(/\D/g, '');
    // Family-app scale (a handful to a few dozen users) — a full scan with the
    // exact same comparison as before is simpler and safer than translating
    // this fuzzy username-or-phone match into a fragile Mongo query.
    const users = await UserModel.find().lean();
    const match = users.find(
      (u: any) => u.username.toLowerCase() === norm || (u.phone || '').replace(/\D/g, '') === normDigits
    );
    return match ? clean<User>(match) : undefined;
  }

  public async getAllUsers(): Promise<User[]> {
    const docs = await UserModel.find().lean();
    return docs.map((d) => clean<User>(d)).sort((a, b) => a.name.localeCompare(b.name));
  }

  public async addUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastSeenEventAt'>): Promise<User> {
    const now = new Date().toISOString();
    const doc = await UserModel.create({
      ...user,
      id: newId('usr'),
      createdAt: now,
      updatedAt: now,
      // Only notify a newly added member about events created after they joined,
      // not the entire event history.
      lastSeenEventAt: now,
    });
    return clean<User>(doc.toObject());
  }

  public async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const now = new Date().toISOString();
    const updated = await UserModel.findOneAndUpdate(
      { id },
      { $set: { ...updates, updatedAt: now } },
      { new: true }
    ).lean();
    if (!updated) return null;

    if (updates.name || updates.fatherName || updates.phone) {
      const snapshotUpdate: Record<string, string> = {};
      if (updates.name) snapshotUpdate.memberName = updates.name;
      if (updates.fatherName) snapshotUpdate.memberFatherName = updates.fatherName;
      if (updates.phone) snapshotUpdate.memberPhone = updates.phone;
      await EventMemberPaymentModel.updateMany({ memberId: id }, { $set: snapshotUpdate });
    }

    return clean<User>(updated);
  }

  public async deleteUser(id: string): Promise<boolean> {
    const now = new Date().toISOString();
    const updated = await UserModel.findOneAndUpdate(
      { id },
      { $set: { active: false, updatedAt: now } }
    ).lean();
    return !!updated;
  }

  // ---------- Events ----------

  public async getAllEvents(): Promise<EventRecord[]> {
    const docs = await EventModel.find().lean();
    return docs
      .map((d) => clean<EventRecord>(d))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public async findEventById(id: string): Promise<EventRecord | undefined> {
    const doc = await EventModel.findOne({ id }).lean();
    return doc ? clean<EventRecord>(doc) : undefined;
  }

  public async createEvent(data: {
    name: string;
    description: string;
    date: string;
    requiredAmountPerMember: number;
    totalExpense?: number;
    createdBy: string;
  }): Promise<EventRecord> {
    const now = new Date().toISOString();
    const newEvent = {
      id: newId('evt'),
      name: data.name,
      description: data.description,
      date: data.date,
      requiredAmountPerMember: Number(data.requiredAmountPerMember) || 0,
      totalExpense: Number(data.totalExpense) || 0,
      createdBy: data.createdBy,
      createdAt: now,
      updatedAt: now,
    };
    await EventModel.create(newEvent);

    const activeContributingMembers = await UserModel.find({ active: true, role: { $ne: 'viewer' } }).lean();
    if (activeContributingMembers.length > 0) {
      await EventMemberPaymentModel.insertMany(
        activeContributingMembers.map((member: any) => ({
          id: `emp_${newEvent.id}_${member.id}`,
          eventId: newEvent.id,
          memberId: member.id,
          memberName: member.name,
          memberFatherName: member.fatherName,
          memberPhone: member.phone,
          requiredAmount: newEvent.requiredAmountPerMember,
          paidAmount: 0,
          pendingAmount: newEvent.requiredAmountPerMember,
          status: 'unpaid',
          updatedAt: now,
        }))
      );
    }

    return newEvent;
  }

  public async updateEvent(id: string, updates: Partial<EventRecord>): Promise<EventRecord | null> {
    const oldEvent = await EventModel.findOne({ id }).lean();
    if (!oldEvent) return null;

    const now = new Date().toISOString();
    const newReqAmount =
      updates.requiredAmountPerMember !== undefined
        ? Number(updates.requiredAmountPerMember)
        : (oldEvent as any).requiredAmountPerMember;
    const newTotalExpense =
      updates.totalExpense !== undefined ? Number(updates.totalExpense) : (oldEvent as any).totalExpense;

    const updated = await EventModel.findOneAndUpdate(
      { id },
      { $set: { ...updates, requiredAmountPerMember: newReqAmount, totalExpense: newTotalExpense, updatedAt: now } },
      { new: true }
    ).lean();

    if (
      updates.requiredAmountPerMember !== undefined &&
      updates.requiredAmountPerMember !== (oldEvent as any).requiredAmountPerMember
    ) {
      const payments = await EventMemberPaymentModel.find({ eventId: id });
      for (const emp of payments) {
        emp.requiredAmount = newReqAmount;
        emp.pendingAmount = Math.max(0, newReqAmount - emp.paidAmount);
        emp.status = emp.paidAmount >= newReqAmount && newReqAmount > 0 ? 'paid' : emp.paidAmount > 0 ? 'partial' : 'unpaid';
        emp.updatedAt = now;
        await emp.save();
      }
    }

    return updated ? clean<EventRecord>(updated) : null;
  }

  public async deleteEvent(id: string): Promise<boolean> {
    const deleted = await EventModel.findOneAndDelete({ id });
    if (!deleted) return false;

    await Promise.all([
      ExpenseModel.deleteMany({ eventId: id }),
      EventMemberPaymentModel.deleteMany({ eventId: id }),
      PaymentTransactionModel.deleteMany({ eventId: id }),
      LedgerTransactionModel.deleteMany({ eventId: id }),
    ]);

    return true;
  }

  // ---------- New-event notifications ----------

  /**
   * Events created after the member's last "seen" watermark, excluding any
   * they created themselves (defensive — only admins can create events today,
   * and admins never see this list from the route layer anyway).
   */
  public async getUnseenEvents(userId: string): Promise<EventRecord[]> {
    const user = await this.findUserById(userId);
    if (!user) return [];

    const query: any = { createdBy: { $ne: userId } };
    if (user.lastSeenEventAt) {
      query.createdAt = { $gt: user.lastSeenEventAt };
    }

    const docs = await EventModel.find(query).lean();
    return docs
      .map((d) => clean<EventRecord>(d))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async markEventsSeen(userId: string): Promise<void> {
    await UserModel.updateOne({ id: userId }, { $set: { lastSeenEventAt: new Date().toISOString() } });
  }

  // ---------- Expenses ----------

  public async getExpensesByEventId(eventId: string): Promise<ExpenseItem[]> {
    const docs = await ExpenseModel.find({ eventId }).lean();
    return docs
      .map((d) => clean<ExpenseItem>(d))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public async addExpense(data: {
    eventId: string;
    title: string;
    amount: number;
    description?: string;
    date: string;
    createdBy: string;
  }): Promise<ExpenseItem> {
    const now = new Date().toISOString();
    const event = await this.findEventById(data.eventId);
    if (!event) throw new Error('Event not found');

    const newExpense: ExpenseItem = {
      id: newId('exp'),
      eventId: data.eventId,
      title: data.title,
      amount: Number(data.amount) || 0,
      description: data.description || '',
      date: data.date,
      createdBy: data.createdBy,
      createdAt: now,
    };
    await ExpenseModel.create(newExpense);

    const eventExpenses = await ExpenseModel.find({ eventId: data.eventId }).lean();
    const totalExpense = eventExpenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
    await EventModel.updateOne({ id: data.eventId }, { $set: { totalExpense, updatedAt: now } });

    await LedgerTransactionModel.create({
      id: `led_${newExpense.id}`,
      type: 'expense_out',
      amount: newExpense.amount,
      eventId: data.eventId,
      eventName: event.name,
      description: `Expense: ${newExpense.title}`,
      date: newExpense.date,
      recordedBy: data.createdBy,
      createdAt: now,
    });

    return newExpense;
  }

  public async deleteExpense(expenseId: string): Promise<boolean> {
    const expense = await ExpenseModel.findOneAndDelete({ id: expenseId }).lean();
    if (!expense) return false;

    const eventId = (expense as any).eventId;
    const remaining = await ExpenseModel.find({ eventId }).lean();
    const totalExpense = remaining.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
    await EventModel.updateOne({ id: eventId }, { $set: { totalExpense, updatedAt: new Date().toISOString() } });
    await LedgerTransactionModel.deleteOne({ id: `led_${expenseId}` });

    return true;
  }

  // ---------- Payments ----------

  public async getEventMemberPayments(eventId: string): Promise<EventMemberPayment[]> {
    const docs = await EventMemberPaymentModel.find({ eventId }).lean();
    const enriched = await Promise.all(
      docs.map(async (d: any) => {
        const u = await this.findUserById(d.memberId);
        return {
          ...clean<EventMemberPayment>(d),
          memberWhatsapp: u?.whatsapp || u?.phone || d.memberPhone || '',
          memberPhone: u?.phone || d.memberPhone || '',
          memberName: u?.name || d.memberName,
          memberFatherName: u?.fatherName || d.memberFatherName,
        };
      })
    );
    return enriched.sort((a, b) => a.memberName.localeCompare(b.memberName));
  }

  public async getMemberPaymentHistory(memberId: string) {
    const memberPayments = await EventMemberPaymentModel.find({ memberId }).lean();
    const history = await Promise.all(
      memberPayments.map(async (emp: any) => {
        const event = await this.findEventById(emp.eventId);
        const txs = await this.getPaymentTransactions(emp.eventId, memberId);
        return {
          event: event || { id: emp.eventId, name: 'Unknown Event', date: '', totalExpense: 0 },
          paymentRecord: clean<EventMemberPayment>(emp),
          transactions: txs,
        };
      })
    );
    return history.sort((a, b) => new Date(b.event.date || 0).getTime() - new Date(a.event.date || 0).getTime());
  }

  public async getPaymentTransactions(eventId: string, memberId?: string): Promise<PaymentTransaction[]> {
    const query: any = { eventId };
    if (memberId) query.memberId = memberId;
    const docs = await PaymentTransactionModel.find(query).lean();
    return docs
      .map((d) => clean<PaymentTransaction>(d))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public async recordPayment(data: {
    eventId: string;
    memberId: string;
    amount: number;
    date: string;
    note?: string;
    recordedBy: string;
  }): Promise<{ paymentRecord: EventMemberPayment; transaction: PaymentTransaction }> {
    const amount = Number(data.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }

    const event = await this.findEventById(data.eventId);
    if (!event) throw new Error('Event not found');

    const member = await this.findUserById(data.memberId);
    if (!member) throw new Error('Member not found');

    const now = new Date().toISOString();
    let paymentRecord = await EventMemberPaymentModel.findOne({ eventId: data.eventId, memberId: data.memberId });

    if (!paymentRecord) {
      paymentRecord = await EventMemberPaymentModel.create({
        id: `emp_${data.eventId}_${data.memberId}`,
        eventId: data.eventId,
        memberId: data.memberId,
        memberName: member.name,
        memberFatherName: member.fatherName,
        memberPhone: member.phone,
        requiredAmount: event.requiredAmountPerMember,
        paidAmount: 0,
        pendingAmount: event.requiredAmountPerMember,
        status: 'unpaid',
        updatedAt: now,
      });
    }

    const newTx = await PaymentTransactionModel.create({
      id: newId('tx'),
      eventId: data.eventId,
      memberId: data.memberId,
      paymentRecordId: paymentRecord.id,
      amount,
      date: data.date,
      note: data.note || '',
      recordedBy: data.recordedBy,
      createdAt: now,
    });

    paymentRecord.paidAmount += amount;
    paymentRecord.pendingAmount = Math.max(0, paymentRecord.requiredAmount - paymentRecord.paidAmount);
    paymentRecord.status =
      paymentRecord.paidAmount >= paymentRecord.requiredAmount ? 'paid' : paymentRecord.paidAmount > 0 ? 'partial' : 'unpaid';
    paymentRecord.updatedAt = now;
    await paymentRecord.save();

    await LedgerTransactionModel.create({
      id: `led_${newTx.id}`,
      type: 'payment_in',
      amount,
      eventId: data.eventId,
      eventName: event.name,
      memberId: data.memberId,
      memberName: member.name,
      description: `Payment from ${member.name}${data.note ? ` (${data.note})` : ''}`,
      date: data.date,
      recordedBy: data.recordedBy,
      createdAt: now,
    });

    return {
      paymentRecord: clean<EventMemberPayment>(paymentRecord.toObject()),
      transaction: clean<PaymentTransaction>(newTx.toObject()),
    };
  }

  public async getRecentLedger(limit = 10): Promise<LedgerTransaction[]> {
    const docs = await LedgerTransactionModel.find().lean();
    return docs
      .map((d) => clean<LedgerTransaction>(d))
      .sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime() ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, limit);
  }

  // ---------- Aggregates ----------

  public async calculateAvailableFund(): Promise<number> {
    const [fundMeta, txs, events] = await Promise.all([
      FundMetaModel.findOne({ key: 'main_fund' }).lean(),
      PaymentTransactionModel.find().select('amount').lean(),
      EventModel.find().select('totalExpense').lean(),
    ]);
    const initialFund = Number((fundMeta as any)?.initialFund) || 0;
    const totalPaymentsReceived = txs.reduce((sum: number, tx: any) => sum + (Number(tx.amount) || 0), 0);
    const totalExpenses = events.reduce((sum: number, evt: any) => sum + (Number(evt.totalExpense) || 0), 0);
    return initialFund + totalPaymentsReceived - totalExpenses;
  }

  public async calculateStats() {
    const [availableFund, totalEvents, totalMembers, totalCollectedAmount, totalPendingAmount, totalExpenses] =
      await Promise.all([
        this.calculateAvailableFund(),
        EventModel.countDocuments(),
        UserModel.countDocuments({ active: true }),
        PaymentTransactionModel.find()
          .select('amount')
          .lean()
          .then((txs: any[]) => txs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)),
        EventMemberPaymentModel.find()
          .select('pendingAmount')
          .lean()
          .then((emps: any[]) => emps.reduce((sum, e) => sum + (Number(e.pendingAmount) || 0), 0)),
        EventModel.find()
          .select('totalExpense')
          .lean()
          .then((evts: any[]) => evts.reduce((sum, e) => sum + (Number(e.totalExpense) || 0), 0)),
      ]);

    return {
      availableFund,
      totalEvents,
      totalMembers,
      totalCollectedAmount,
      totalPendingAmount,
      totalExpenses,
    };
  }
}
