// ---------- Betting & Wager ----------

export type WagerStatus = 'pending' | 'won' | 'lost' | 'refunded';

export interface Wager {
  id: string; // UUID, primary key
  gameId: string; // FK -> Game.id
  userId: string; // FK -> User.id
  stake: number;
  potentialPayout: number;
  winBoost: number; // decimal multiplier, e.g. 0.1 = +10% bonus on win, default 0
  status: WagerStatus;
  placedAt: string;
  settledAt?: string;
}

/**
 * Placeholder payout formula (even-money 2x stake plus boost).
 * Replace with your real odds/rake logic. Always recompute and validate
 * server-side — never trust a client-submitted potentialPayout value.
 */
export function calculatePotentialPayout(stake: number, winBoost: number = 0): number {
  return stake * 2 * (1 + winBoost);
}