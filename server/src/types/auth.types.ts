import { Role } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  name: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
}
