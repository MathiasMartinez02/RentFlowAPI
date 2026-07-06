import { Module } from '@nestjs/common';
import { LeadsModule } from '../leads/leads.module';
import { PublicPropertiesController } from './public-properties.controller';
import { PublicPropertiesService } from './public-properties.service';
import { PublicLeadsController } from './public-leads.controller';
import { PublicLeadsService } from './public-leads.service';

@Module({
  imports: [LeadsModule],
  controllers: [PublicPropertiesController, PublicLeadsController],
  providers: [PublicPropertiesService, PublicLeadsService],
})
export class PublicModule {}
