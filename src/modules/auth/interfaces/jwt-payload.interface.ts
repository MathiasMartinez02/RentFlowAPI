export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  organizationId?: string | null;
  linkedTenantId?: string | null;
  // Random per-token identifier so two tokens issued for the same user within the same
  // second (same iat) never sign identically and collide on refresh_tokens.hashedToken.
  jti?: string;
}
