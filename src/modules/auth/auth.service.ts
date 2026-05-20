import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create({ ...dto, password: hashed });
    const accessToken = this.sign(user.id, user.email, user.role);

    this.logger.log(`User registered: ${user.email}`);

    return {
      message: 'User registered successfully',
      data: { user: this.sanitize(user), accessToken },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const accessToken = this.sign(user.id, user.email, user.role);
    this.logger.log(`User logged in: ${user.email}`);

    return {
      message: 'Login successful',
      data: { user: this.sanitize(user), accessToken },
    };
  }

  private sign(userId: string, email: string, role: string) {
    return this.jwtService.sign({ sub: userId, email, role });
  }

  private sanitize(user: any) {
    const { password, ...rest } = user;
    return rest;
  }
}
