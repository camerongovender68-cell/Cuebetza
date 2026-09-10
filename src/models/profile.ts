// ---------- Profile (mirrors the public.profiles table) ----------
// Extends Supabase's built-in auth.users, which already stores email
// and the hashed password. See supabase/schema.sql.
//
// Column names are snake_case here, matching what supabase-js actually
// returns from a query -- unlike the rest of src/models/, which describes
// app-level request/response shapes rather than raw DB rows.

import type { PlayerLevel, UserStatus } from './user';

export interface Profile {
  id: string; // PK, FK -> auth.users.id
  username: string;
  name: string | null;
  surname: string | null;
  contact_number: string | null;
  level: PlayerLevel;
  balance: number;
  status: UserStatus;
  kyc_verified: boolean;
  created_at: string;
  updated_at: string;
}
