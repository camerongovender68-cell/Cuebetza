// ---------- Rooms / Matchmaking ----------

import type { PlayerLevel } from './user';
import type { PoolTableVariant } from './games';

export type RoomStatus = 'open' | 'full' | 'in_progress' | 'closed';

export interface Room {
  id: string; // UUID, primary key (roomId)
  tableId: string; // FK -> OperatingTable.id
  variant: PoolTableVariant;
  requiredLevel?: PlayerLevel; // optional skill gate for who can join
  maxPlayers: number; // typically 2 for 1v1 pool
  status: RoomStatus;
  createdAt: string;
}

// Join table: a room has many players, a player can pass through many rooms over time
export interface RoomPlayer {
  roomId: string; // FK -> Room.id
  playerId: string; // FK -> User.id
  playerLevel: PlayerLevel; // snapshot of level at join time, for fairness auditing
  joinedAt: string;
  leftAt?: string;
}

export interface MatchmakingQueueEntry {
  id: string; // UUID, primary key
  playerId: string; // FK -> User.id
  playerLevel: PlayerLevel;
  variant: PoolTableVariant;
  desiredStake?: number; // ties matchmaking to a wager tier
  queuedAt: string;
}