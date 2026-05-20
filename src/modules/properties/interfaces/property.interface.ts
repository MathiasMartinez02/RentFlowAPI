import { PropertyStatus, PropertyType } from '../../../common/enums/property.enum';

export interface IProperty {
  id: string;
  nombre: string;
  descripcion: string | null;
  direccion: string;
  ciudad: string;
  provincia: string;
  codigoPostal: string;
  pais: string;
  tipoPropiedad: PropertyType;
  estado: PropertyStatus;
  precioMensual: number;
  expensas: number | null;
  habitaciones: number;
  banos: number;
  metrosCuadrados: number;
  imagenPrincipal: string | null;
  isActive: boolean;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPropertyDetail extends IProperty {
  owner: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  };
  _count: {
    contracts: number;
    maintenanceTickets: number;
  };
}

export interface FindManyResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
