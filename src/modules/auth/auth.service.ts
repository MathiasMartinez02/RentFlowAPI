import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { AuthTokens } from './interfaces/auth-tokens.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

type SafeUser = {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  empresa: string | null;
  phone: string | null;
  avatar: string | null;
  role: string;
  organizationId: string | null;
  linkedTenantId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const USER_SELECT = {
  id: true,
  email: true,
  nombre: true,
  apellido: true,
  empresa: true,
  phone: true,
  avatar: true,
  role: true,
  organizationId: true,
  linkedTenantId: true,
  isActive: true,
  ultimoLogin: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Public Methods ───────────────────────────────────────────

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        nombre: dto.nombre,
        apellido: dto.apellido,
        email: dto.email,
        password: hashed,
        empresa: dto.empresa,
        role: dto.role,
      },
      select: USER_SELECT,
    });

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.organizationId,
      user.linkedTenantId,
    );
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    this.logger.log(`User registered: ${user.email}`);

    return {
      message: 'Registration successful',
      data: { ...tokens, user },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.organizationId,
      user.linkedTenantId,
    );

    // Fire-and-forget: store refresh token + track last login (non-blocking)
    await Promise.all([
      this.storeRefreshToken(user.id, tokens.refreshToken),
      this.prisma.user.update({
        where: { id: user.id },
        data: { ultimoLogin: new Date() },
      }),
    ]);

    this.logger.log(`User logged in: ${user.email}`);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...safeUser } = user;

    return {
      message: 'Login successful',
      data: { ...tokens, user: safeUser },
    };
  }

  async refresh(userId: string, rawRefreshToken: string) {
    const hashedToken = this.hashToken(rawRefreshToken);

    const storedToken = await this.prisma.refreshToken.findFirst({
      where: { userId, hashedToken, revoked: false },
    });

    if (!storedToken) throw new UnauthorizedException('Refresh token invalid or revoked');
    if (storedToken.expiresAt < new Date()) {
      // Clean up expired token
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true },
      });
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_SELECT,
    });
    if (!user || !user.isActive) throw new UnauthorizedException('User not found or inactive');

    // Rotation: revoke old token, issue new pair
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.organizationId,
      user.linkedTenantId,
    );
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    this.logger.log(`Tokens rotated for user: ${user.email}`);

    return {
      message: 'Tokens refreshed successfully',
      data: { ...tokens },
    };
  }

  async logout(userId: string, rawRefreshToken: string) {
    const hashedToken = this.hashToken(rawRefreshToken);

    const storedToken = await this.prisma.refreshToken.findFirst({
      where: { userId, hashedToken, revoked: false },
    });

    if (storedToken) {
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true },
      });
    }

    this.logger.log(`User logged out: ${userId}`);

    return {
      message: 'Logged out successfully',
      data: null,
    };
  }

  getProfile(user: SafeUser) {
    return {
      message: 'Profile retrieved successfully',
      data: user,
    };
  }

  // ─── Private Helpers ──────────────────────────────────────────

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    organizationId?: string | null,
    linkedTenantId?: string | null,
  ): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
      organizationId,
      linkedTenantId,
      jti: randomUUID(),
    };

    const accessExpiresIn = this.configService.get<string>('jwt.accessExpiresIn', '15m');
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn', '7d');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: accessExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: refreshExpiresIn,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseDurationToSeconds(accessExpiresIn),
    };
  }

  private async storeRefreshToken(userId: string, rawToken: string): Promise<void> {
    const hashedToken = this.hashToken(rawToken);
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn', '7d');
    const expiresAt = new Date(Date.now() + this.parseDurationToMs(refreshExpiresIn));

    await this.prisma.refreshToken.create({
      data: { hashedToken, userId, expiresAt },
    });

    // Clean up old revoked/expired tokens for this user (housekeeping)
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        OR: [{ revoked: true }, { expiresAt: { lt: new Date() } }],
        NOT: { hashedToken },
      },
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseDurationToMs(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000;
    const [, value, unit] = match;
    const multipliers: Record<string, number> = {
      s: 1_000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };
    return parseInt(value, 10) * multipliers[unit];
  }

  private parseDurationToSeconds(duration: string): number {
    return this.parseDurationToMs(duration) / 1000;
  }
}
