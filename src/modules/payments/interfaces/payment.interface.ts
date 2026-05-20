import { PaymentMethod, PaymentStatus } from '../../../common/enums/payment.enum';

export interface IPayment {
  id: string;
  periodo: string;
  fechaVencimiento: Date;
  fechaPago: Date | null;
  monto: number;
  mora: number | null;
  totalPagado: number | null;
  metodoPago: PaymentMethod | null;
  referenciaPago: string | null;
  estado: PaymentStatus;
  observaciones: string | null;
  isActive: boolean;
  ownerId: string;
  contractId: string;
  tenantId: string;
  propertyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentDetail extends IPayment {
  contract: {
    id: string;
    codigoContrato: string;
  };
  tenant: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  };
  property: {
    id: string;
    nombre: string;
    ciudad: string;
  };
}

export interface IPaymentStats {
  totalCobradoMes: number;
  pagosPendientes: number;
  pagosVencidos: number;
  ingresosTotales: number;
  porcentajeCobranza: number;
  montoPendiente: number;
  montoVencido: number;
}
