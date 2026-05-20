import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to database');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('cleanDatabase is only available in test environment');
    }
    const tables = await this.$queryRaw<{ TABLE_NAME: string }[]>`
      SELECT TABLE_NAME FROM information_schema.tables
      WHERE table_schema = DATABASE() AND TABLE_NAME != '_prisma_migrations'
    `;
    await this.$executeRaw`SET FOREIGN_KEY_CHECKS = 0`;
    for (const { TABLE_NAME } of tables) {
      await this.$executeRawUnsafe(`TRUNCATE TABLE \`${TABLE_NAME}\``);
    }
    await this.$executeRaw`SET FOREIGN_KEY_CHECKS = 1`;
  }
}
