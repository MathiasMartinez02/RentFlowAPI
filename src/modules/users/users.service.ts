import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { buildPaginatedResult, getPaginationMeta } from '../../common/utils/pagination.util';
import { CreateUserDto } from './dto/create-user.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { IUser, IUserWithPassword } from './interfaces/user.interface';

const USER_SELECT = {
  id: true,
  email: true,
  nombre: true,
  apellido: true,
  empresa: true,
  phone: true,
  avatar: true,
  role: true,
  isActive: true,
  ultimoLogin: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Write ────────────────────────────────────────────────────

  async create(dto: CreateUserDto): Promise<IUserWithPassword> {
    return this.prisma.user.create({ data: dto }) as Promise<IUserWithPassword>;
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    await this.assertExists(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
      select: USER_SELECT,
    });
    return { message: 'Profile updated successfully', data: user };
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { ultimoLogin: new Date() },
    });
  }

  async deactivate(id: string) {
    await this.assertExists(id);
    await this.prisma.user.update({ where: { id }, data: { isActive: false } });
    this.logger.log(`User deactivated: ${id}`);
    return { message: 'User deactivated successfully', data: null };
  }

  // ─── Read ─────────────────────────────────────────────────────

  async findAll(filters: FilterUsersDto) {
    const { skip, take, page, limit } = getPaginationMeta(filters);

    const where = {
      ...(filters.role !== undefined && { role: filters.role }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.search && {
        OR: [
          { nombre: { contains: filters.search } },
          { apellido: { contains: filters.search } },
          { email: { contains: filters.search } },
          { empresa: { contains: filters.search } },
        ],
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: USER_SELECT,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      message: 'Users retrieved successfully',
      data: buildPaginatedResult(items, total, page, limit),
    };
  }

  async findById(id: string): Promise<IUser> {
    const user = await this.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user as IUser;
  }

  async findByEmail(email: string): Promise<IUserWithPassword | null> {
    return this.prisma.user.findUnique({ where: { email } }) as Promise<IUserWithPassword | null>;
  }

  // ─── Private ──────────────────────────────────────────────────

  private async assertExists(id: string): Promise<void> {
    const exists = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException(`User ${id} not found`);
  }
}
