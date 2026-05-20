import { ContractStatus } from '../../../common/enums/contract.enum';
import { PropertyStatus } from '../../../common/enums/property.enum';
import { TenantStatus } from '../../../common/enums/tenant.enum';

export interface IContract {
  id: string;
  codigoContrato: string;
  fechaInicio: Date;
  fechaFin: Date;
  montoMensual: number;
  deposito: number;
  expensas: number | null;
  renovacionAutomatica: boolean;
  estado: ContractStatus;
  observaciones: string | null;
  isActive: boolean;
  ownerId: string;
  propertyId: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IContractDetail extends IContract {
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
    ciudad: string;
    estado: PropertyStatus;
  };
  tenant: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    estado: TenantStatus;
  };
  _count: {
    payments: number;
  };
}
