import { Role } from '../../../common/enums/role.enum';

export interface IUser {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  empresa: string | null;
  phone: string | null;
  avatar: string | null;
  role: Role;
  organizationId: string | null;
  linkedTenantId: string | null;
  isActive: boolean;
  ultimoLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserWithPassword extends IUser {
  password: string;
}

export type SafeUser = Omit<IUserWithPassword, 'password'>;
