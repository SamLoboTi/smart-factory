import { Body, Controller, Get, Post } from '@nestjs/common';
import { NotificationConfigInput } from './notification-config.store';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @Get('config')
  getConfig() {
    return this.notificationsService.getPublicConfig();
  }

  @Post('config')
  saveConfig(@Body() body: Partial<NotificationConfigInput>) {
    return this.notificationsService.saveConfig(body);
  }

  @Post('test')
  sendTest() {
    return this.notificationsService.sendTest();
  }
}
