import { Controller, Get } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  getDashboard() {
    return this.reportsService.getDashboardStats();
  }

  @Get('forecast')
  getForecast() {
    // In a real app we might get storeId from User/Request
    return this.reportsService.getDemandForecast();
  }

  @Get('recent-sales')
  getRecentSales() {
    return this.reportsService.getRecentSales(20);
  }

  @Get('sales-by-date')
  getSalesByDate() {
    return this.reportsService.getSalesByDate();
  }
}
