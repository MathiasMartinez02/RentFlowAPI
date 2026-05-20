import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

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
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    return this.prisma.user.create({ data: dto });
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      select: USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });
    return { message: 'Users retrieved successfully', data: users };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findById(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
      select: USER_SELECT,
    });
    return { message: 'User updated successfully', data: user };
  }

  async deactivate(id: string) {
    await this.findById(id);
    await this.prisma.user.update({ where: { id }, data: { isActive: false } });
    return { message: 'User deactivated successfully', data: null };
  }
}
