import { Module } from '@nestjs/common';
import { LocalStorageService } from './services/local-storage.service';
import { UploadsService } from './services/uploads.service';
import { UploadsController } from './controllers/uploads.controller';
import { STORAGE_PROVIDER } from './interfaces/storage.interface';

@Module({
  controllers: [UploadsController],
  providers: [
    UploadsService,
    LocalStorageService,
    {
      provide: STORAGE_PROVIDER,
      useClass: LocalStorageService,
    },
  ],
  exports: [UploadsService],
})
export class UploadsModule {}
