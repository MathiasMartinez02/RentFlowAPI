import { apiClient, unwrap } from './client';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; nombre: string; apellido: string; role: string };
}

export interface RegisterDto {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  empresa?: string;
}

export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await apiClient.post('/auth/login', { email, password });
    const tokens = unwrap<LoginResponse>(res);
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    return tokens;
  },

  async register(dto: RegisterDto): Promise<LoginResponse> {
    const res = await apiClient.post('/auth/register', dto);
    const tokens = unwrap<LoginResponse>(res);
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    return tokens;
  },

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken');
    await apiClient.post('/auth/logout', { refreshToken }).catch(() => {});
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  async getProfile() {
    const res = await apiClient.get('/auth/me');
    return unwrap(res);
  },
};
