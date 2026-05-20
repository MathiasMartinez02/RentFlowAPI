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
      this.prisma.property.count({ where: { ownerId, status: PropertyStatus.AVAILABLE } }),
      this.prisma.property.count({ where: { ownerId, status: PropertyStatus.RENTED } }),
      this.prisma.contract.count({
        where: { property: { ownerId }, status: ContractStatus.ACTIVE },
      }),
      this.prisma.payment.count({
        where: {
          contract: { property: { ownerId } },
          status: PaymentStatus.PENDING,
        },
      }),
      this.prisma.payment.count({
        where: {
          contract: { property: { ownerId } },
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
          contract: { property: { ownerId } },
          status: PaymentStatus.PAID,
          paidDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    return {
      message: 'Dashboard stats retrieved successfully',
      data: {
        properties: { total: totalProperties, available: availableProperties, rented: rentedProperties },
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
    const [recentPayments, recentTickets, expiringContracts] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where: { contract: { property: { ownerId } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          contract: {
            select: {
              tenant: { select: { firstName: true, lastName: true } },
              property: { select: { title: true } },
            },
          },
        },
      }),
      this.prisma.maintenanceTicket.findMany({
        where: { property: { ownerId }, status: { in: ['OPEN', 'IN_PROGRESS'] } },
        orderBy: { priority: 'desc' },
        take: 5,
        include: { property: { select: { title: true } } },
      }),
      this.prisma.contract.findMany({
        where: {
          property: { ownerId },
          status: ContractStatus.ACTIVE,
          endDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        },
        include: {
          tenant: { select: { firstName: true, lastName: true, email: true } },
          property: { select: { title: true } },
        },
        orderBy: { endDate: 'asc' },
        take: 5,
      }),
    ]);

    return {
      message: 'Recent activity retrieved successfully',
      data: { recentPayments, recentTickets, expiringContracts },
    };
  }
}
