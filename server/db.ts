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
  deleted?: boolean;
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

// In-Memory Storage for fallback when MongoDB is not configured or unavailable
class MemoryStore {
  users: Map<string, User> = new Map();
  events: Map<string, EventRecord> = new Map();
  expenses: Map<string, ExpenseItem> = new Map();
  eventMemberPayments: Map<string, EventMemberPayment> = new Map();
  paymentTransactions: Map<string, PaymentTransaction> = new Map();
  ledgerTransactions: Map<string, LedgerTransaction> = new Map();
  initialFund: number = 50000;
  seeded: boolean = false;

  seed() {
    if (this.seeded) return;
    this.seeded = true;
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    // Seed Admin
    const admin: User = {
      id: 'usr_admin',
      username: 'admin',
      passwordHash: bcrypt.hashSync('admin123', 10),
      name: 'Admin Account',
      fatherName: 'System',
      address: 'Main Office',
      phone: '03001234567',
      whatsapp: '03001234567',
      role: 'admin',
      active: true,
      createdAt: now,
      updatedAt: now,
      lastSeenEventAt: now,
    };
    this.users.set(admin.id, admin);

    // Seed Member 1
    const member1: User = {
      id: 'usr_tariq',
      username: '03001112233',
      passwordHash: bcrypt.hashSync('family123', 10),
      name: 'Tariq Khan',
      fatherName: 'Zeb Khan',
      address: 'House #12, Street 4, Islamabad',
      phone: '03001112233',
      whatsapp: '03001112233',
      role: 'member',
      active: true,
      createdAt: now,
      updatedAt: now,
      lastSeenEventAt: now,
    };
    this.users.set(member1.id, member1);

    // Seed Member 2
    const member2: User = {
      id: 'usr_rashid',
      username: '03002223344',
      passwordHash: bcrypt.hashSync('family123', 10),
      name: 'Rashid Ali',
      fatherName: 'Ghulam Ali',
      address: 'House #55, Sector G-9, Islamabad',
      phone: '03002223344',
      whatsapp: '03002223344',
      role: 'member',
      active: true,
      createdAt: now,
      updatedAt: now,
      lastSeenEventAt: now,
    };
    this.users.set(member2.id, member2);

    // Seed Member 3
    const member3: User = {
      id: 'usr_bilal',
      username: '03003334455',
      passwordHash: bcrypt.hashSync('family123', 10),
      name: 'Bilal Ahmed',
      fatherName: 'Ahmed Jan',
      address: 'House #8, DHA Phase 2, Rawalpindi',
      phone: '03003334455',
      whatsapp: '03003334455',
      role: 'member',
      active: true,
      createdAt: now,
      updatedAt: now,
      lastSeenEventAt: now,
    };
    this.users.set(member3.id, member3);

    // Seed Viewer
    const viewer: User = {
      id: 'usr_farhan',
      username: '03009998877',
      passwordHash: bcrypt.hashSync('family123', 10),
      name: 'Farhan Akhtar (Viewer)',
      fatherName: 'Akhtar Ali',
      address: 'Peshawar Road, Rawalpindi',
      phone: '03009998877',
      whatsapp: '03009998877',
      role: 'viewer',
      active: true,
      createdAt: now,
      updatedAt: now,
      lastSeenEventAt: now,
    };
    this.users.set(viewer.id, viewer);

    // Seed Event 1
    const event1Id = 'evt_annual_reunion_2026';
    const event1: EventRecord = {
      id: event1Id,
      name: 'Family Annual Reunion 2026',
      description: 'Annual gathering for all family members with dinner and activities.',
      date: today,
      requiredAmountPerMember: 5000,
      totalExpense: 7500,
      createdBy: admin.id,
      createdAt: now,
      updatedAt: now,
    };
    this.events.set(event1.id, event1);

    // Expenses for Event 1
    const exp1: ExpenseItem = {
      id: 'exp_tent_sound',
      eventId: event1Id,
      title: 'Tent & Sound System Setup',
      amount: 3500,
      description: 'Sound equipment and outdoor tent arrangements',
      date: today,
      createdBy: admin.id,
      createdAt: now,
    };
    const exp2: ExpenseItem = {
      id: 'exp_catering_advance',
      eventId: event1Id,
      title: 'Catering & Refreshments Advance',
      amount: 4000,
      description: 'Deposit for dinner buffet',
      date: today,
      createdBy: admin.id,
      createdAt: now,
    };
    this.expenses.set(exp1.id, exp1);
    this.expenses.set(exp2.id, exp2);

    // Ledger for expenses
    this.ledgerTransactions.set(`led_${exp1.id}`, {
      id: `led_${exp1.id}`,
      type: 'expense_out',
      amount: exp1.amount,
      eventId: event1Id,
      eventName: event1.name,
      description: `Expense: ${exp1.title}`,
      date: exp1.date,
      recordedBy: admin.id,
      createdAt: now,
    });
    this.ledgerTransactions.set(`led_${exp2.id}`, {
      id: `led_${exp2.id}`,
      type: 'expense_out',
      amount: exp2.amount,
      eventId: event1Id,
      eventName: event1.name,
      description: `Expense: ${exp2.title}`,
      date: exp2.date,
      recordedBy: admin.id,
      createdAt: now,
    });

    // Payment records for contributing members (admin, member1, member2, member3)
    const contributingMembers = [admin, member1, member2, member3];
    for (const m of contributingMembers) {
      const empId = `emp_${event1Id}_${m.id}`;
      let paid = 0;
      let status: 'paid' | 'partial' | 'unpaid' = 'unpaid';

      if (m.id === member1.id) {
        paid = 5000;
        status = 'paid';
      } else if (m.id === member2.id) {
        paid = 2500;
        status = 'partial';
      } else if (m.id === admin.id) {
        paid = 5000;
        status = 'paid';
      }

      const pending = Math.max(0, 5000 - paid);
      this.eventMemberPayments.set(empId, {
        id: empId,
        eventId: event1Id,
        memberId: m.id,
        memberName: m.name,
        memberFatherName: m.fatherName,
        memberPhone: m.phone,
        memberWhatsapp: m.whatsapp,
        requiredAmount: 5000,
        paidAmount: paid,
        pendingAmount: pending,
        status,
        updatedAt: now,
      });

      if (paid > 0) {
        const txId = `tx_${event1Id}_${m.id}`;
        this.paymentTransactions.set(txId, {
          id: txId,
          eventId: event1Id,
          memberId: m.id,
          paymentRecordId: empId,
          amount: paid,
          date: today,
          note: 'Initial contribution payment',
          recordedBy: admin.id,
          createdAt: now,
        });

        this.ledgerTransactions.set(`led_${txId}`, {
          id: `led_${txId}`,
          type: 'payment_in',
          amount: paid,
          eventId: event1Id,
          eventName: event1.name,
          memberId: m.id,
          memberName: m.name,
          description: `Payment from ${m.name}`,
          date: today,
          recordedBy: admin.id,
          createdAt: now,
        });
      }
    }
  }
}

const memoryStore = new MemoryStore();

async function ensureMongoSeeded(): Promise<void> {
  const userCount = await UserModel.countDocuments();
  if (userCount > 0) return;

  console.log('🌱 No users found in MongoDB — seeding initial admin account...');
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
    { initialFund: 50000, updatedAt: now },
    { upsert: true }
  );
  console.log('✅ Seeded admin account in MongoDB (username: admin, password: admin123).');
}

export class Database {
  private static instance: Database;
  private static readyPromise: Promise<void> | null = null;
  private static useMongo: boolean = false;

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public static async init(): Promise<Database> {
    const db = Database.getInstance();
    if (!Database.readyPromise) {
      Database.readyPromise = (async () => {
        try {
          const connected = await connectToMongoDB();
          if (connected) {
            Database.useMongo = true;
            await ensureMongoSeeded();
            return;
          }
        } catch (err: any) {
          console.warn('[Database] MongoDB connection failed, falling back to in-memory store:', err?.message || err);
        }

        Database.useMongo = false;
        memoryStore.seed();
        console.log('💾 Database running in in-memory storage mode (mock active).');
      })();
    }
    await Database.readyPromise;
    return db;
  }

  // ---------- Users ----------

  public async findUserById(id: string): Promise<User | undefined> {
    if (Database.useMongo) {
      const doc = await UserModel.findOne({ id }).lean();
      return doc ? clean<User>(doc) : undefined;
    }
    const user = memoryStore.users.get(id);
    return user ? { ...user } : undefined;
  }

  public async findUserByUsername(username: string): Promise<User | undefined> {
    const norm = username.trim().toLowerCase();
    const normDigits = norm.replace(/\D/g, '');

    if (Database.useMongo) {
      const users = await UserModel.find({ deleted: { $ne: true } }).lean();
      // First try exact username match
      let match = users.find((u: any) => u.username.toLowerCase() === norm);
      if (!match && normDigits) {
        match = users.find((u: any) => (u.phone || '').replace(/\D/g, '') === normDigits);
      }
      return match ? clean<User>(match) : undefined;
    }

    const all = Array.from(memoryStore.users.values()).filter((u) => !u.deleted);
    let match = all.find((u) => u.username.toLowerCase() === norm);
    if (!match && normDigits) {
      match = all.find((u) => (u.phone || '').replace(/\D/g, '') === normDigits);
    }
    return match ? { ...match } : undefined;
  }

  public async findUsersByIdentifier(identifier: string): Promise<User[]> {
    const norm = identifier.trim().toLowerCase();
    const normDigits = norm.replace(/\D/g, '');

    if (Database.useMongo) {
      const users = await UserModel.find({ deleted: { $ne: true } }).lean();
      return users
        .filter(
          (u: any) =>
            u.username.toLowerCase() === norm ||
            (normDigits && (u.phone || '').replace(/\D/g, '') === normDigits)
        )
        .map((u: any) => clean<User>(u));
    }

    return Array.from(memoryStore.users.values())
      .filter(
        (u) =>
          !u.deleted &&
          (u.username.toLowerCase() === norm ||
            (normDigits && (u.phone || '').replace(/\D/g, '') === normDigits))
      )
      .map((u) => ({ ...u }));
  }

  public async getAllUsers(includeDeleted = false): Promise<User[]> {
    if (Database.useMongo) {
      const query = includeDeleted ? {} : { deleted: { $ne: true }, active: true };
      const docs = await UserModel.find(query).lean();
      return docs.map((d) => clean<User>(d)).sort((a, b) => a.name.localeCompare(b.name));
    }
    return Array.from(memoryStore.users.values())
      .filter((u) => includeDeleted || (!u.deleted && u.active))
      .map((u) => ({ ...u }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  public async addUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastSeenEventAt'>): Promise<User> {
    const now = new Date().toISOString();
    const newUser: User = {
      ...user,
      id: newId('usr'),
      deleted: false,
      createdAt: now,
      updatedAt: now,
      lastSeenEventAt: now,
    };

    if (Database.useMongo) {
      const doc = await UserModel.create(newUser);
      return clean<User>(doc.toObject());
    }

    memoryStore.users.set(newUser.id, newUser);
    return { ...newUser };
  }

  public async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const now = new Date().toISOString();

    if (Database.useMongo) {
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

    const existing = memoryStore.users.get(id);
    if (!existing) return null;

    const updatedUser: User = {
      ...existing,
      ...updates,
      updatedAt: now,
    };
    memoryStore.users.set(id, updatedUser);

    if (updates.name || updates.fatherName || updates.phone) {
      for (const [key, emp] of memoryStore.eventMemberPayments.entries()) {
        if (emp.memberId === id) {
          memoryStore.eventMemberPayments.set(key, {
            ...emp,
            memberName: updates.name || emp.memberName,
            memberFatherName: updates.fatherName !== undefined ? updates.fatherName : emp.memberFatherName,
            memberPhone: updates.phone || emp.memberPhone,
          });
        }
      }
    }

    return { ...updatedUser };
  }

  public async deleteUser(id: string): Promise<boolean> {
    const now = new Date().toISOString();
    if (Database.useMongo) {
      const updated = await UserModel.findOneAndUpdate(
        { id },
        { $set: { active: false, deleted: true, updatedAt: now } }
      ).lean();
      return !!updated;
    }

    const existing = memoryStore.users.get(id);
    if (!existing) return false;
    memoryStore.users.set(id, { ...existing, active: false, deleted: true, updatedAt: now });
    return true;
  }

  // ---------- Events ----------

  public async getAllEvents(): Promise<EventRecord[]> {
    if (Database.useMongo) {
      const docs = await EventModel.find().lean();
      return docs
        .map((d) => clean<EventRecord>(d))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return Array.from(memoryStore.events.values())
      .map((e) => ({ ...e }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public async findEventById(id: string): Promise<EventRecord | undefined> {
    if (Database.useMongo) {
      const doc = await EventModel.findOne({ id }).lean();
      return doc ? clean<EventRecord>(doc) : undefined;
    }
    const event = memoryStore.events.get(id);
    return event ? { ...event } : undefined;
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
    const newEvent: EventRecord = {
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

    if (Database.useMongo) {
      await EventModel.create(newEvent);
      const activeContributingMembers = await UserModel.find({ active: true, deleted: { $ne: true }, role: { $ne: 'viewer' } }).lean();
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

    memoryStore.events.set(newEvent.id, newEvent);
    const activeContributingMembers = Array.from(memoryStore.users.values()).filter(
      (u) => u.active && !u.deleted && u.role !== 'viewer'
    );
    for (const member of activeContributingMembers) {
      const empId = `emp_${newEvent.id}_${member.id}`;
      memoryStore.eventMemberPayments.set(empId, {
        id: empId,
        eventId: newEvent.id,
        memberId: member.id,
        memberName: member.name,
        memberFatherName: member.fatherName,
        memberPhone: member.phone,
        memberWhatsapp: member.whatsapp,
        requiredAmount: newEvent.requiredAmountPerMember,
        paidAmount: 0,
        pendingAmount: newEvent.requiredAmountPerMember,
        status: 'unpaid',
        updatedAt: now,
      });
    }

    return { ...newEvent };
  }

  public async updateEvent(id: string, updates: Partial<EventRecord>): Promise<EventRecord | null> {
    const now = new Date().toISOString();

    if (Database.useMongo) {
      const oldEvent = await EventModel.findOne({ id }).lean();
      if (!oldEvent) return null;

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
          emp.status =
            emp.paidAmount >= newReqAmount && newReqAmount > 0 ? 'paid' : emp.paidAmount > 0 ? 'partial' : 'unpaid';
          emp.updatedAt = now;
          await emp.save();
        }
      }

      return updated ? clean<EventRecord>(updated) : null;
    }

    const oldEvent = memoryStore.events.get(id);
    if (!oldEvent) return null;

    const newReqAmount =
      updates.requiredAmountPerMember !== undefined
        ? Number(updates.requiredAmountPerMember)
        : oldEvent.requiredAmountPerMember;
    const newTotalExpense =
      updates.totalExpense !== undefined ? Number(updates.totalExpense) : oldEvent.totalExpense;

    const updatedEvent: EventRecord = {
      ...oldEvent,
      ...updates,
      requiredAmountPerMember: newReqAmount,
      totalExpense: newTotalExpense,
      updatedAt: now,
    };
    memoryStore.events.set(id, updatedEvent);

    if (updates.requiredAmountPerMember !== undefined && updates.requiredAmountPerMember !== oldEvent.requiredAmountPerMember) {
      for (const [key, emp] of memoryStore.eventMemberPayments.entries()) {
        if (emp.eventId === id) {
          const pending = Math.max(0, newReqAmount - emp.paidAmount);
          const status = emp.paidAmount >= newReqAmount && newReqAmount > 0 ? 'paid' : emp.paidAmount > 0 ? 'partial' : 'unpaid';
          memoryStore.eventMemberPayments.set(key, {
            ...emp,
            requiredAmount: newReqAmount,
            pendingAmount: pending,
            status,
            updatedAt: now,
          });
        }
      }
    }

    return { ...updatedEvent };
  }

  public async deleteEvent(id: string): Promise<boolean> {
    if (Database.useMongo) {
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

    if (!memoryStore.events.has(id)) return false;
    memoryStore.events.delete(id);

    for (const [key, exp] of memoryStore.expenses.entries()) {
      if (exp.eventId === id) memoryStore.expenses.delete(key);
    }
    for (const [key, emp] of memoryStore.eventMemberPayments.entries()) {
      if (emp.eventId === id) memoryStore.eventMemberPayments.delete(key);
    }
    for (const [key, tx] of memoryStore.paymentTransactions.entries()) {
      if (tx.eventId === id) memoryStore.paymentTransactions.delete(key);
    }
    for (const [key, led] of memoryStore.ledgerTransactions.entries()) {
      if (led.eventId === id) memoryStore.ledgerTransactions.delete(key);
    }

    return true;
  }

  // ---------- New-event notifications ----------

  public async getUnseenEvents(userId: string): Promise<EventRecord[]> {
    const user = await this.findUserById(userId);
    if (!user) return [];

    if (Database.useMongo) {
      const query: any = { createdBy: { $ne: userId } };
      if (user.lastSeenEventAt) {
        query.createdAt = { $gt: user.lastSeenEventAt };
      }

      const docs = await EventModel.find(query).lean();
      return docs
        .map((d) => clean<EventRecord>(d))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return Array.from(memoryStore.events.values())
      .filter((e) => e.createdBy !== userId && (!user.lastSeenEventAt || e.createdAt > user.lastSeenEventAt))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async markEventsSeen(userId: string): Promise<void> {
    const now = new Date().toISOString();
    if (Database.useMongo) {
      await UserModel.updateOne({ id: userId }, { $set: { lastSeenEventAt: now } });
      return;
    }

    const user = memoryStore.users.get(userId);
    if (user) {
      memoryStore.users.set(userId, { ...user, lastSeenEventAt: now });
    }
  }

  // ---------- Expenses ----------

  public async getExpensesByEventId(eventId: string): Promise<ExpenseItem[]> {
    if (Database.useMongo) {
      const docs = await ExpenseModel.find({ eventId }).lean();
      return docs
        .map((d) => clean<ExpenseItem>(d))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return Array.from(memoryStore.expenses.values())
      .filter((e) => e.eventId === eventId)
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

    if (Database.useMongo) {
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

    memoryStore.expenses.set(newExpense.id, newExpense);
    const eventExpenses = Array.from(memoryStore.expenses.values()).filter((e) => e.eventId === data.eventId);
    const totalExpense = eventExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    memoryStore.events.set(data.eventId, { ...event, totalExpense, updatedAt: now });

    memoryStore.ledgerTransactions.set(`led_${newExpense.id}`, {
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

    return { ...newExpense };
  }

  public async deleteExpense(expenseId: string): Promise<boolean> {
    if (Database.useMongo) {
      const expense = await ExpenseModel.findOneAndDelete({ id: expenseId }).lean();
      if (!expense) return false;

      const eventId = (expense as any).eventId;
      const remaining = await ExpenseModel.find({ eventId }).lean();
      const totalExpense = remaining.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
      await EventModel.updateOne({ id: eventId }, { $set: { totalExpense, updatedAt: new Date().toISOString() } });
      await LedgerTransactionModel.deleteOne({ id: `led_${expenseId}` });

      return true;
    }

    const expense = memoryStore.expenses.get(expenseId);
    if (!expense) return false;

    const eventId = expense.eventId;
    memoryStore.expenses.delete(expenseId);
    memoryStore.ledgerTransactions.delete(`led_${expenseId}`);

    const remaining = Array.from(memoryStore.expenses.values()).filter((e) => e.eventId === eventId);
    const totalExpense = remaining.reduce((sum, e) => sum + Number(e.amount), 0);
    const event = memoryStore.events.get(eventId);
    if (event) {
      memoryStore.events.set(eventId, { ...event, totalExpense, updatedAt: new Date().toISOString() });
    }

    return true;
  }

  // ---------- Payments ----------

  public async getEventMemberPayments(eventId: string): Promise<EventMemberPayment[]> {
    if (Database.useMongo) {
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

    const docs = Array.from(memoryStore.eventMemberPayments.values()).filter((emp) => emp.eventId === eventId);
    const enriched = await Promise.all(
      docs.map(async (d) => {
        const u = await this.findUserById(d.memberId);
        return {
          ...d,
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
    if (Database.useMongo) {
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

    const memberPayments = Array.from(memoryStore.eventMemberPayments.values()).filter(
      (emp) => emp.memberId === memberId
    );
    const history = await Promise.all(
      memberPayments.map(async (emp) => {
        const event = await this.findEventById(emp.eventId);
        const txs = await this.getPaymentTransactions(emp.eventId, memberId);
        return {
          event: event || { id: emp.eventId, name: 'Unknown Event', date: '', totalExpense: 0 },
          paymentRecord: { ...emp },
          transactions: txs,
        };
      })
    );
    return history.sort((a, b) => new Date(b.event.date || 0).getTime() - new Date(a.event.date || 0).getTime());
  }

  public async getPaymentTransactions(eventId: string, memberId?: string): Promise<PaymentTransaction[]> {
    if (Database.useMongo) {
      const query: any = { eventId };
      if (memberId) query.memberId = memberId;
      const docs = await PaymentTransactionModel.find(query).lean();
      return docs
        .map((d) => clean<PaymentTransaction>(d))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return Array.from(memoryStore.paymentTransactions.values())
      .filter((tx) => tx.eventId === eventId && (!memberId || tx.memberId === memberId))
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

    if (Database.useMongo) {
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
        paymentRecord.paidAmount >= paymentRecord.requiredAmount
          ? 'paid'
          : paymentRecord.paidAmount > 0
          ? 'partial'
          : 'unpaid';
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

    const empId = `emp_${data.eventId}_${data.memberId}`;
    let paymentRecord = memoryStore.eventMemberPayments.get(empId);

    if (!paymentRecord) {
      paymentRecord = {
        id: empId,
        eventId: data.eventId,
        memberId: data.memberId,
        memberName: member.name,
        memberFatherName: member.fatherName,
        memberPhone: member.phone,
        memberWhatsapp: member.whatsapp,
        requiredAmount: event.requiredAmountPerMember,
        paidAmount: 0,
        pendingAmount: event.requiredAmountPerMember,
        status: 'unpaid',
        updatedAt: now,
      };
    }

    const txId = newId('tx');
    const newTx: PaymentTransaction = {
      id: txId,
      eventId: data.eventId,
      memberId: data.memberId,
      paymentRecordId: paymentRecord.id,
      amount,
      date: data.date,
      note: data.note || '',
      recordedBy: data.recordedBy,
      createdAt: now,
    };
    memoryStore.paymentTransactions.set(txId, newTx);

    const newPaidAmount = paymentRecord.paidAmount + amount;
    const newPendingAmount = Math.max(0, paymentRecord.requiredAmount - newPaidAmount);
    const newStatus =
      newPaidAmount >= paymentRecord.requiredAmount ? 'paid' : newPaidAmount > 0 ? 'partial' : 'unpaid';

    const updatedPaymentRecord: EventMemberPayment = {
      ...paymentRecord,
      paidAmount: newPaidAmount,
      pendingAmount: newPendingAmount,
      status: newStatus,
      updatedAt: now,
    };
    memoryStore.eventMemberPayments.set(empId, updatedPaymentRecord);

    memoryStore.ledgerTransactions.set(`led_${txId}`, {
      id: `led_${txId}`,
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
      paymentRecord: { ...updatedPaymentRecord },
      transaction: { ...newTx },
    };
  }

  public async getRecentLedger(limit = 10): Promise<LedgerTransaction[]> {
    if (Database.useMongo) {
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

    return Array.from(memoryStore.ledgerTransactions.values())
      .sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime() ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, limit);
  }

  // ---------- Aggregates ----------

  public async calculateAvailableFund(): Promise<number> {
    if (Database.useMongo) {
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

    const totalPaymentsReceived = Array.from(memoryStore.paymentTransactions.values()).reduce(
      (sum, tx) => sum + (Number(tx.amount) || 0),
      0
    );
    const totalExpenses = Array.from(memoryStore.events.values()).reduce(
      (sum, evt) => sum + (Number(evt.totalExpense) || 0),
      0
    );
    return memoryStore.initialFund + totalPaymentsReceived - totalExpenses;
  }

  public async calculateStats() {
    if (Database.useMongo) {
      const [availableFund, totalEvents, totalMembers, totalCollectedAmount, totalPendingAmount, totalExpenses] =
        await Promise.all([
          this.calculateAvailableFund(),
          EventModel.countDocuments(),
          UserModel.countDocuments({ active: true, deleted: { $ne: true } }),
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

    const availableFund = await this.calculateAvailableFund();
    const totalEvents = memoryStore.events.size;
    const totalMembers = Array.from(memoryStore.users.values()).filter((u) => u.active && !u.deleted).length;
    const totalCollectedAmount = Array.from(memoryStore.paymentTransactions.values()).reduce(
      (sum, tx) => sum + (Number(tx.amount) || 0),
      0
    );
    const totalPendingAmount = Array.from(memoryStore.eventMemberPayments.values()).reduce(
      (sum, emp) => sum + (Number(emp.pendingAmount) || 0),
      0
    );
    const totalExpenses = Array.from(memoryStore.events.values()).reduce(
      (sum, evt) => sum + (Number(evt.totalExpense) || 0),
      0
    );

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
