import type { Request } from 'express';

export type AuthenticatedUser = {
  userId: string;
  email: string;
};

export type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};
