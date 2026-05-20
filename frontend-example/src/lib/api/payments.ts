import { apiClient, unwrap } from './client';

export interface Payment {
  id: string;
  monto: number;
  montoMora: number;
  montoTotal: number;
  estado: string;
  metodoPago?: string;
  fechaVencimiento: string;
  fechaPago?: string;
  periodo: string;
  notas?: string;
  contract: {
    id: string;
    property: { id: string; nombre: string; direccion: string };
    tenant: { id: string; nombre: string; apellido: string };
  };
}

export interface PaymentListResponse {
  data: Payment[];
  meta: { total: number; page: number; lastPage: number; limit: number };
}

export interface RegisterPaymentDto {
  metodoPago: string;
  fechaPago?: string;
  notas?: string;
}

export const paymentsApi = {
  async list(params?: {
    page?: number;
    limit?: number;
    estado?: string;
    contractId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaymentListResponse> {
    const res = await apiClient.get('/payments', { params });
    return unwrap(res);
  },

  async get(id: string): Promise<Payment> {
    const res = await apiClient.get(`/payments/${id}`);
    return unwrap(res);
  },

  async registerPayment(id: string, dto: RegisterPaymentDto): Promise<Payment> {
    const res = await apiClient.patch(`/payments/${id}/pay`, dto);
    return unwrap(res);
  },

  async markOverdue(id: string): Promise<Payment> {
    const res = await apiClient.patch(`/payments/${id}/overdue`);
    return unwrap(res);
  },
};
