export type UserRole = 'admin' | 'member' | 'viewer';
export type PaymentStatus = 'paid' | 'partial' | 'unpaid';

export interface User {
  id: string;
  username: string;
  name: string;
  fatherName: string;
  address: string;
  phone: string;
  whatsapp: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  totalPending?: number;
  totalPaid?: number;
  totalEvents?: number;
  paidEvents?: number;
  partialEvents?: number;
  unpaidEvents?: number;
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
  status: PaymentStatus;
  updatedAt: string;
}

export interface EventItem {
  id: string;
  name: string;
  description: string;
  date: string;
  requiredAmountPerMember: number;
  totalExpense: number;
  totalPaid?: number;
  totalPending?: number;
  membersCount?: number;
  paidCount?: number;
  partialCount?: number;
  unpaidCount?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventDetailsResponse {
  event: EventItem & {
    totalExpense: number;
    totalCollected: number;
    totalPending: number;
  };
  expenses: ExpenseItem[];
  memberPayments: EventMemberPayment[];
  transactions: PaymentTransaction[];
}

export interface MemberHistoryItem {
  event: {
    id: string;
    name: string;
    date: string;
    description?: string;
    totalExpense: number;
  };
  paymentRecord: EventMemberPayment;
  transactions: PaymentTransaction[];
}

export interface MemberDetailsResponse {
  member: User;
  summary: {
    totalEvents: number;
    paidEvents: number;
    partialEvents: number;
    unpaidEvents: number;
    totalPaid: number;
    totalPending: number;
  };
  history: MemberHistoryItem[];
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

export interface DashboardStats {
  availableFund: number;
  totalEvents: number;
  totalMembers: number;
  totalCollectedAmount: number;
  totalPendingAmount: number;
  totalExpenses: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentEvents: Array<{
    id: string;
    name: string;
    date: string;
    description: string;
    requiredAmountPerMember: number;
    totalExpense: number;
    totalCollected: number;
    totalPending: number;
    membersCount: number;
  }>;
  recentLedger: LedgerTransaction[];
}

export interface DemoUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  phone: string;
  samplePassword: string;
}
