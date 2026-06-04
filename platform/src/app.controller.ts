import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get('sensores')
  async getSensores() {
    return this.appService.getLatestReadings();
  }

  @Get()
  getHealth() {
    return { status: 'ok', service: 'smart-factory-api' };
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

  @Post('predict-failure')
  async predictFailure(@Body() body: Record<string, unknown>) {
    return this.appService.predictFailure(body);
  }

  @Post('detect-anomaly')
  async detectAnomaly(@Body() body: Record<string, unknown>) {
    return this.appService.detectAnomaly(body);
  }

  @Get('equipment/:id/risk')
  async getEquipmentRisk(@Param('id') id: string) {
    return this.appService.getEquipmentRisk(id);
  }
}
