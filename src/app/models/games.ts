// ---------- Games ----------

export type GameMode = 'ai_vs_player' | 'player_vs_player';

export type PoolTableVariant = '8_ball' | '9_ball' | 'classic';

export type GameStatus = 'waiting' | 'in_progress' | 'completed' | 'cancelled';

export interface Game {
  id: string; // UUID, primary key
  mode: GameMode;
  variant: PoolTableVariant;
  tableId: string; // FK -> OperatingTable.id
  roomId?: string; // FK -> Room.id (present for PvP matches created via matchmaking)
  player1Id: string; // FK -> User.id
  player2Id: string | null; // FK -> User.id, null when mode is 'ai_vs_player'
  status: GameStatus;
  winnerId?: string; // FK -> User.id
  startedAt?: string;
  endedAt?: string;
}