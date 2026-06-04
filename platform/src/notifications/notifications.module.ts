import { Module } from '@nestjs/common';
import { NotificationConfigStore } from './notification-config.store';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationConfigStore, NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule { }
