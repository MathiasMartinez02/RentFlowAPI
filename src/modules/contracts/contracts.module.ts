import { Module } from '@nestjs/common';
import { ContractRepository } from './repositories/contract.repository';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [ContractsController],
  providers: [ContractsService, ContractRepository],
  exports: [ContractsService],
})
export class ContractsModule {}
