import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '../../common/enums/role.enum';

// Mock PrismaService with just the delegates AuthService touches.
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
};

const mockJwtService = {
  signAsync: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string, fallback?: unknown) => {
    const values: Record<string, string> = {
      'jwt.accessExpiresIn': '15m',
      'jwt.refreshExpiresIn': '7d',
      'jwt.secret': 'access-secret',
      'jwt.refreshSecret': 'refresh-secret',
    };
    return values[key] ?? fallback;
  }),
};

const baseUser = {
  id: 'user-1',
  email: 'test@rentflow.com',
  nombre: 'Test',
  apellido: 'User',
  empresa: null,
  phone: null,
  avatar: null,
  role: Role.ADMIN,
  organizationId: null,
  linkedTenantId: null,
  isActive: true,
  ultimoLogin: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockJwtService.signAsync.mockResolvedValue('signed-token');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    const dto: RegisterDto = {
      nombre: 'Test',
      apellido: 'User',
      email: 'test@rentflow.com',
      password: 'Password123*',
      role: Role.ADMIN,
    } as RegisterDto;

    it('throws ConflictException when the email is already registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(baseUser);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('creates the user with a hashed password and issues a token pair', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(baseUser);
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.register(dto);

      const createArgs = mockPrisma.user.create.mock.calls[0][0];
      expect(createArgs.data.password).not.toBe(dto.password);
      expect(await bcrypt.compare(dto.password, createArgs.data.password)).toBe(true);
      expect(result.data.accessToken).toBe('signed-token');
      expect(result.data.user.email).toBe(baseUser.email);
    });
  });

  describe('login', () => {
    const dto: LoginDto = { email: 'test@rentflow.com', password: 'Password123*' };

    it('throws UnauthorizedException when the user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when the user is inactive', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...baseUser, isActive: false });

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when the password does not match', async () => {
      const hashed = await bcrypt.hash('a-different-password', 12);
      mockPrisma.user.findUnique.mockResolvedValue({ ...baseUser, password: hashed });

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('returns tokens and the safe user (without password) on success', async () => {
      const hashed = await bcrypt.hash(dto.password, 12);
      mockPrisma.user.findUnique.mockResolvedValue({ ...baseUser, password: hashed });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.login(dto);

      expect(result.data.accessToken).toBe('signed-token');
      expect(result.data.user).not.toHaveProperty('password');
    });
  });

  describe('refresh', () => {
    const rawToken = 'raw-refresh-token';

    it('throws UnauthorizedException when the stored token is missing or already revoked', async () => {
      mockPrisma.refreshToken.findFirst.mockResolvedValue(null);

      await expect(service.refresh(baseUser.id, rawToken)).rejects.toThrow(UnauthorizedException);
    });

    it('revokes an expired token and throws UnauthorizedException', async () => {
      mockPrisma.refreshToken.findFirst.mockResolvedValue({
        id: 'rt-1',
        expiresAt: new Date(Date.now() - 1000),
      });
      mockPrisma.refreshToken.update.mockResolvedValue({});

      await expect(service.refresh(baseUser.id, rawToken)).rejects.toThrow(UnauthorizedException);
      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'rt-1' },
        data: { revoked: true },
      });
    });

    it('rotates the token: revokes the old one and issues a new pair', async () => {
      mockPrisma.refreshToken.findFirst.mockResolvedValue({
        id: 'rt-1',
        expiresAt: new Date(Date.now() + 100_000),
      });
      mockPrisma.user.findUnique.mockResolvedValue(baseUser);
      mockPrisma.refreshToken.update.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.refresh(baseUser.id, rawToken);

      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'rt-1' },
        data: { revoked: true },
      });
      expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
      expect(result.data.accessToken).toBe('signed-token');
    });
  });

  describe('logout', () => {
    it('revokes the matching stored refresh token when found', async () => {
      mockPrisma.refreshToken.findFirst.mockResolvedValue({ id: 'rt-1' });
      mockPrisma.refreshToken.update.mockResolvedValue({});

      await service.logout(baseUser.id, 'raw-token');

      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'rt-1' },
        data: { revoked: true },
      });
    });

    it('does nothing (no throw) when no matching token is found', async () => {
      mockPrisma.refreshToken.findFirst.mockResolvedValue(null);

      await expect(service.logout(baseUser.id, 'raw-token')).resolves.toEqual({
        message: 'Logged out successfully',
        data: null,
      });
      expect(mockPrisma.refreshToken.update).not.toHaveBeenCalled();
    });
  });
});
