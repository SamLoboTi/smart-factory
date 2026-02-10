import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get('sensores')
  async getSensores() {
    return this.appService.getLatestReadings();
  }

  @Get('kpis')
  async getKPIs(
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.appService.getKPIs(start, end);
  }

  @Get('alertas')
  async getAlerts() {
    return this.appService.getAlerts();
  }

  @Post('chat')
  async chat(@Body() body: { message: string }) {
    return this.appService.processChat(body.message);
  }

  @Get('report/full')
  async getFullReport() {
    return this.appService.generateFullReport();
  }
}
