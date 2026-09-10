// ---------- Operating Tables & Tournaments ----------

import type { PoolTableVariant } from './games';

export type OperatingTableType = 'standard' | 'tournament' | 'special';

export interface OperatingTable {
  id: string; // UUID, primary key
  type: OperatingTableType;
  variant: PoolTableVariant;
  minStake: number;
  maxStake: number;
  capacity: number;
  activePlayers: number;
  activePlayerIds: string[]; // array of FK -> User.id, one entry per seated player, length must match activePlayers
}

export type TournamentStatus = 'registration' | 'in_progress' | 'completed';

export interface Tournament {
  id: string; // UUID, primary key
  name: string;
  variant: PoolTableVariant;
  tableId: string; // FK -> OperatingTable.id
  entryFee: number;
  prizePool: number;
  status: TournamentStatus;
  startsAt: string;
  endsAt?: string;
}

// Join table: a tournament has many participants, a user can enter many tournaments
export interface TournamentParticipant {
  tournamentId: string; // FK -> Tournament.id
  userId: string; // FK -> User.id
  registeredAt: string;
  placement?: number; // final ranking, set once tournament completes
}