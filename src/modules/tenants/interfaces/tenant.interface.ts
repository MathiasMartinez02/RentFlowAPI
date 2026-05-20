import { TenantStatus } from '../../../common/enums/tenant.enum';

export interface ITenant {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  dni: string;
  fechaNacimiento: Date | null;
  direccion: string | null;
  estado: TenantStatus;
  observaciones: string | null;
  isActive: boolean;
  ownerId: string;
  propertyId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITenantDetail extends ITenant {
  owner: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  };
  property: {
    id: string;
    nombre: string;
    direccion: string;
  } | null;
  _count: {
    contracts: number;
  };
}
