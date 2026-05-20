import { Module } from '@nestjs/common';
import { TenantRepository } from './repositories/tenant.repository';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

@Module({
  controllers: [TenantsController],
  providers: [TenantsService, TenantRepository],
  exports: [TenantsService],
})
export class TenantsModule {}
