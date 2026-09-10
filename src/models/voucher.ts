// ---------- Wallet: Vouchers, Withdrawals, Transaction Ledger ----------

export type VoucherStatus = 'issued' | 'redeemed' | 'expired';

export interface Voucher {
  id: string; // UUID, primary key
  code: string; // unique
  value: number;
  status: VoucherStatus;
  issuedToUserId: string | null; // FK -> User.id (null if unclaimed/generic code)
  issuedAt: string;
  redeemedAt?: string;
  expiresAt?: string;
}

export interface RedeemVoucherRequest {
  userId: string; // FK -> User.id
  voucherCode: string;
}

export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'completed';
export type PayoutMethod = 'bank_transfer' | 'e_wallet' | 'voucher';

export interface WithdrawalRequest {
  id: string; // UUID, primary key
  userId: string; // FK -> User.id
  amount: number;
  method: PayoutMethod;
  status: WithdrawalStatus;
  requestedAt: string;
  processedAt?: string;
  transactionId?: string; // FK -> Transaction.id, set once processed
}

// Source of truth for all balance changes. User.balance should only ever
// be updated as a derived result of inserting a row here.
export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'voucher_redeem'
  | 'wager_stake'
  | 'wager_payout'
  | 'refund';

export interface Transaction {
  id: string; // UUID, primary key
  userId: string; // FK -> User.id
  type: TransactionType;
  amount: number; // positive = credit, negative = debit
  balanceAfter: number; // user's balance snapshot after this transaction, for auditability
  referenceId?: string; // FK -> Wager.id, Voucher.id, or WithdrawalRequest.id depending on type
  createdAt: string;
}