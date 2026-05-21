import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '../../common/enums/role.enum';
import { PrismaService } from '../../database/prisma.service';
import { buildPaginatedResult, getPaginationMeta } from '../../common/utils/pagination.util';
import { CreateUserDto } from './dto/create-user.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
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
  organizationId: true,
  linkedTenantId: true,
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

  async activate(id: string) {
    await this.assertExists(id);
    await this.prisma.user.update({ where: { id }, data: { isActive: true } });
    this.logger.log(`User activated: ${id}`);
    return { message: 'User activated successfully', data: null };
  }

  async changeRole(id: string, dto: ChangeRoleDto) {
    await this.assertExists(id);

    const updateData: {
      role: Role;
      organizationId?: string | null;
      linkedTenantId?: string | null;
    } = { role: dto.role };

    if (dto.organizationId !== undefined) updateData.organizationId = dto.organizationId;
    if (dto.linkedTenantId !== undefined) updateData.linkedTenantId = dto.linkedTenantId;

    // Clear org fields when promoting to owner roles
    if ([Role.ADMIN, Role.SUPER_ADMIN, Role.CLIENTE].includes(dto.role)) {
      updateData.organizationId = null;
    }
    // Clear linkedTenantId when not INQUILINO
    if (dto.role !== Role.INQUILINO) {
      updateData.linkedTenantId = null;
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: USER_SELECT,
    });

    this.logger.log(`Role changed for user ${id}: ${user.role}`);
    return { message: 'User role updated successfully', data: user };
  }

  // ─── Read ─────────────────────────────────────────────────────

  async findAll(filters: FilterUsersDto, caller?: { id: string; role: string }) {
    const { skip, take, page, limit } = getPaginationMeta(filters);

    const orgCondition =
      caller && caller.role !== Role.SUPER_ADMIN
        ? { OR: [{ id: caller.id }, { organizationId: caller.id }] }
        : null;

    const searchCondition = filters.search
      ? {
          OR: [
            { nombre: { contains: filters.search } },
            { apellido: { contains: filters.search } },
            { email: { contains: filters.search } },
            { empresa: { contains: filters.search } },
          ],
        }
      : null;

    const where = {
      ...(filters.role !== undefined && { role: filters.role as any }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(orgCondition && searchCondition
        ? { AND: [orgCondition, searchCondition] }
        : (orgCondition ?? searchCondition ?? {})),
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
