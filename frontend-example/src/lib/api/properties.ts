import { apiClient, unwrap } from './client';

export interface Property {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  tipoPropiedad: string;
  estado: string;
  precioAlquiler: number;
  moneda: string;
  ambientes: number;
  metrosCuadrados?: number;
  descripcion?: string;
  isActive: boolean;
  createdAt: string;
  images: Array<{ id: string; url: string }>;
  _count: { contracts: number };
}

export interface CreatePropertyDto {
  nombre: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  codigoPostal?: string;
  pais?: string;
  tipoPropiedad: string;
  precioAlquiler: number;
  moneda?: string;
  ambientes: number;
  metrosCuadrados?: number;
  descripcion?: string;
}

export interface PropertyListResponse {
  data: Property[];
  meta: { total: number; page: number; lastPage: number; limit: number };
}

export const propertiesApi = {
  async list(params?: {
    page?: number;
    limit?: number;
    search?: string;
    estado?: string;
    tipoPropiedad?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PropertyListResponse> {
    const res = await apiClient.get('/properties', { params });
    return unwrap(res);
  },

  async get(id: string): Promise<Property> {
    const res = await apiClient.get(`/properties/${id}`);
    return unwrap(res);
  },

  async create(dto: CreatePropertyDto): Promise<Property> {
    const res = await apiClient.post('/properties', dto);
    return unwrap(res);
  },

  async update(id: string, dto: Partial<CreatePropertyDto>): Promise<Property> {
    const res = await apiClient.patch(`/properties/${id}`, dto);
    return unwrap(res);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/properties/${id}`);
  },

  async uploadImage(propertyId: string, file: File): Promise<{ id: string; url: string }> {
    const form = new FormData();
    form.append('image', file);
    const res = await apiClient.post(`/uploads/property/${propertyId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap(res);
  },

  async deleteImage(imageId: string): Promise<void> {
    await apiClient.delete(`/uploads/property/${imageId}`);
  },
};
