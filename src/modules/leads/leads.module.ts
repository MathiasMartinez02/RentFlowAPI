import { Module } from '@nestjs/common';
import { LeadRepository } from './repositories/lead.repository';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [LeadsController],
  providers: [LeadsService, LeadRepository],
  exports: [LeadsService],
})
export class LeadsModule {}
