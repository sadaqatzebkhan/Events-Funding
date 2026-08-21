import mongoose, { Schema, Document } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// User Schema
export interface IUserDoc extends Document {
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

const UserSchema = new Schema<IUserDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    fatherName: { type: String, default: '' },
    address: { type: String, default: '' },
    phone: { type: String, required: true, index: true },
    whatsapp: { type: String, default: '' },
    role: { type: String, enum: ['admin', 'member', 'viewer'], default: 'member' },
    active: { type: Boolean, default: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
    // Watermark for the "new event" notification modal — events created after
    // this timestamp are shown to the member as unseen, then this advances.
    lastSeenEventAt: { type: String, default: '' },
  },
  { timestamps: false }
);

// Event Schema
export interface IEventDoc extends Document {
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

const EventSchema = new Schema<IEventDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    date: { type: String, required: true },
    requiredAmountPerMember: { type: Number, required: true, default: 0 },
    totalExpense: { type: Number, required: true, default: 0 },
    createdBy: { type: String, required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { timestamps: false }
);

// Expense Item Schema
export interface IExpenseDoc extends Document {
  id: string;
  eventId: string;
  title: string;
  amount: number;
  description?: string;
  date: string;
  createdBy: string;
  createdAt: string;
}

const ExpenseSchema = new Schema<IExpenseDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    eventId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true, default: 0 },
    description: { type: String, default: '' },
    date: { type: String, required: true },
    createdBy: { type: String, required: true },
    createdAt: { type: String, required: true },
  },
  { timestamps: false }
);

// Event Member Payment Schema
export interface IEventMemberPaymentDoc extends Document {
  id: string;
  eventId: string;
  memberId: string;
  memberName: string;
  memberFatherName: string;
  memberPhone: string;
  requiredAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: 'paid' | 'partial' | 'unpaid';
  updatedAt: string;
}

const EventMemberPaymentSchema = new Schema<IEventMemberPaymentDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    eventId: { type: String, required: true, index: true },
    memberId: { type: String, required: true, index: true },
    memberName: { type: String, required: true },
    memberFatherName: { type: String, default: '' },
    memberPhone: { type: String, default: '' },
    requiredAmount: { type: Number, required: true, default: 0 },
    paidAmount: { type: Number, required: true, default: 0 },
    pendingAmount: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ['paid', 'partial', 'unpaid'], default: 'unpaid' },
    updatedAt: { type: String, required: true },
  },
  { timestamps: false }
);

// Payment Transaction Schema
export interface IPaymentTransactionDoc extends Document {
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

const PaymentTransactionSchema = new Schema<IPaymentTransactionDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    eventId: { type: String, required: true, index: true },
    memberId: { type: String, required: true, index: true },
    paymentRecordId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, default: 0 },
    date: { type: String, required: true },
    note: { type: String, default: '' },
    recordedBy: { type: String, required: true },
    createdAt: { type: String, required: true },
  },
  { timestamps: false }
);

// Ledger Transaction Schema
export interface ILedgerTransactionDoc extends Document {
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

const LedgerTransactionSchema = new Schema<ILedgerTransactionDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: ['initial', 'payment_in', 'expense_out'], required: true },
    amount: { type: Number, required: true, default: 0 },
    eventId: { type: String, default: '' },
    eventName: { type: String, default: '' },
    memberId: { type: String, default: '' },
    memberName: { type: String, default: '' },
    description: { type: String, required: true },
    date: { type: String, required: true },
    recordedBy: { type: String, required: true },
    createdAt: { type: String, required: true },
  },
  { timestamps: false }
);

// Fund Meta Schema
export interface IFundMetaDoc extends Document {
  key: string;
  initialFund: number;
  updatedAt: string;
}

const FundMetaSchema = new Schema<IFundMetaDoc>(
  {
    key: { type: String, required: true, unique: true, default: 'main_fund' },
    initialFund: { type: Number, required: true, default: 50000 },
    updatedAt: { type: String, required: true },
  },
  { timestamps: false }
);

export const UserModel = mongoose.model<IUserDoc>('User', UserSchema);
export const EventModel = mongoose.model<IEventDoc>('Event', EventSchema);
export const ExpenseModel = mongoose.model<IExpenseDoc>('Expense', ExpenseSchema);
export const EventMemberPaymentModel = mongoose.model<IEventMemberPaymentDoc>(
  'EventMemberPayment',
  EventMemberPaymentSchema
);
export const PaymentTransactionModel = mongoose.model<IPaymentTransactionDoc>(
  'PaymentTransaction',
  PaymentTransactionSchema
);
export const LedgerTransactionModel = mongoose.model<ILedgerTransactionDoc>(
  'LedgerTransaction',
  LedgerTransactionSchema
);
export const FundMetaModel = mongoose.model<IFundMetaDoc>('FundMeta', FundMetaSchema);

let isConnected = false;

export async function connectToMongoDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not set. This app has no local-storage fallback — set MONGODB_URI in your environment.');
    return false;
  }

  try {
    if (mongoose.connection.readyState === 1) {
      isConnected = true;
      return true;
    }

    console.log('🔄 Connecting to MongoDB Atlas...');
    await mongoose.connect(uri, {
      dbName: 'mutual_fund',
      serverSelectionTimeoutMS: 8000,
    });
    isConnected = true;
    console.log('✅ Connected to MongoDB Atlas (database: mutual_fund)');
    return true;
  } catch (error: any) {
    console.error('❌ MongoDB Atlas Connection Error:', error?.message || error);
    return false;
  }
}

export function isMongoDBConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}
