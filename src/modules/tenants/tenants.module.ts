import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { TenantRepository } from './repositories/tenant.repository';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

@Module({
  imports: [NotificationsModule],
  controllers: [TenantsController],
  providers: [TenantsService, TenantRepository],
  exports: [TenantsService],
})
export class TenantsModule {}
