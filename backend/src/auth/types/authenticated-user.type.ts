import { RolUsuario } from '@prisma/client';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: RolUsuario;
  sessionId: string;
}
