import { Module } from '@nestjs/common';
import { PropertyRepository } from './repositories/property.repository';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';

@Module({
  controllers: [PropertiesController],
  providers: [PropertiesService, PropertyRepository],
  exports: [PropertiesService],
})
export class PropertiesModule {}
