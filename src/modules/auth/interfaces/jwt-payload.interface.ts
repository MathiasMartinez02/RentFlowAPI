export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  organizationId?: string | null;
  linkedTenantId?: string | null;
}
