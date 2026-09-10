// ---------- User ----------

export type PlayerLevel = 'beginner' | 'intermediate' | 'advanced' | 'pro';

export type UserStatus = 'active' | 'suspended' | 'banned';

export interface User {
  id: string; // UUID, primary key
  name: string;
  surname: string;
  email: string; // unique
  contactNumber: string; // unique
  passwordHash: string; // hashed server-side (bcrypt/argon2) — never store or transmit plaintext
  level: PlayerLevel;
  balance: number; // cached balance — always kept in sync via Transaction ledger, never mutated directly
  status: UserStatus;
  kycVerified: boolean; // identity/age verification, important for a real-money gambling app
  createdAt: string;
  updatedAt: string;
}

// Payload shapes for auth flows — never include passwordHash in responses sent to the client
export interface SignUpRequest {
  name: string;
  surname: string;
  email: string;
  contactNumber: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export type PublicUser = Omit<User, 'passwordHash'>;