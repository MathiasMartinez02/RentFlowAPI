import { Injectable, Logger } from '@nestjs/common';
import { ContractStatus, PaymentStatus, PropertyStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getStats(ownerId: string) {
    const [
      totalProperties,
      availableProperties,
      rentedProperties,
      activeContracts,
      pendingPayments,
      overduePayments,
      openTickets,
      monthlyRevenue,
    ] = await this.prisma.$transaction([
      this.prisma.property.count({ where: { ownerId, isActive: true } }),
      this.prisma.property.count({ where: { ownerId, estado: PropertyStatus.DISPONIBLE } }),
      this.prisma.property.count({ where: { ownerId, estado: PropertyStatus.OCUPADA } }),
      this.prisma.contract.count({
        where: { ownerId, isActive: true, estado: ContractStatus.ACTIVO },
      }),
      this.prisma.payment.count({
        where: {
          contract: { ownerId },
          status: PaymentStatus.PENDING,
        },
      }),
      this.prisma.payment.count({
        where: {
          contract: { ownerId },
          status: PaymentStatus.OVERDUE,
        },
      }),
      this.prisma.maintenanceTicket.count({
        where: {
          property: { ownerId },
          status: { in: ['OPEN', 'IN_PROGRESS'] },
        },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          contract: { ownerId },
          status: PaymentStatus.PAID,
          paidDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    return {
      message: 'Estadísticas del dashboard recuperadas correctamente',
      data: {
        properties: {
          total: totalProperties,
          available: availableProperties,
          rented: rentedProperties,
        },
        contracts: { active: activeContracts },
        payments: {
          pending: pendingPayments,
          overdue: overduePayments,
          monthlyRevenue: monthlyRevenue._sum.amount ?? 0,
        },
        maintenance: { open: openTickets },
      },
    };
  }

  async getRecentActivity(ownerId: string) {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const [recentPayments, recentTickets, expiringContracts] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where: { contract: { ownerId } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          contract: {
            select: {
              tenant: { select: { nombre: true, apellido: true } },
              property: { select: { nombre: true } },
            },
          },
        },
      }),
      this.prisma.maintenanceTicket.findMany({
        where: { property: { ownerId }, status: { in: ['OPEN', 'IN_PROGRESS'] } },
        orderBy: { priority: 'desc' },
        take: 5,
        include: { property: { select: { nombre: true } } },
      }),
      this.prisma.contract.findMany({
        where: {
          ownerId,
          isActive: true,
          estado: ContractStatus.ACTIVO,
          fechaFin: { lte: thirtyDaysFromNow },
        },
        include: {
          tenant: { select: { nombre: true, apellido: true, email: true } },
          property: { select: { nombre: true } },
        },
        orderBy: { fechaFin: 'asc' },
        take: 5,
      }),
    ]);

    return {
      message: 'Actividad reciente recuperada correctamente',
      data: { recentPayments, recentTickets, expiringContracts },
    };
  }
}
