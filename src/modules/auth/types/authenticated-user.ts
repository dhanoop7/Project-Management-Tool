import type { Request } from 'express';

export type UserRole = 'ADMIN' | 'USER';

export interface AuthenticatedUser {
  userId: number;
  username: string;
  role: UserRole;
}

export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};
