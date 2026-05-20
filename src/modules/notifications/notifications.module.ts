import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsGateway } from './gateways/notifications.gateway';
import { NotificationRepository } from './repositories/notification.repository';
import { ActivityRepository } from './repositories/activity.repository';
import { NotificationsService } from './notifications.service';
import { ActivityService } from './activity.service';
import { NotificationsController } from './notifications.controller';
import { ActivityController } from './activity.controller';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
      }),
    }),
  ],
  controllers: [NotificationsController, ActivityController],
  providers: [
    NotificationsGateway,
    NotificationsService,
    ActivityService,
    NotificationRepository,
    ActivityRepository,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
