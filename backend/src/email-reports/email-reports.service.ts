import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { ReportFormat } from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { DashboardService } from '../dashboard/dashboard.service';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-writer';

interface ReportData {
  revenue: number;
  revenueChange: number;
  transactions: number;
  averageTransactionValue: number;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  totalCustomers: number;
  activeShifts: number;
  geographicDistribution: Array<{
    region: string;
    sales: number;
    customers: number;
  }>;
  salesTrend: Array<{ date: Date; revenue: number; transactions: number }>;
  period: string;
  storeName: string;
}

@Injectable()
export class EmailReportsService {
  private readonly logger = new Logger(EmailReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly dashboardService: DashboardService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async handleDailyReports() {
    this.logger.log('Starting daily email reports processing');

    const activeConfigs = await this.prisma.emailReportConfig.findMany({
      where: {
        isActive: true,
        frequency: 'DAILY',
        nextSend: { lte: new Date() },
      },
      include: { recipients: true, store: true },
    });

    for (const config of activeConfigs) {
      try {
        await this.processReportConfig(config);

        // Update next send time
        const nextSend = new Date();
        nextSend.setDate(nextSend.getDate() + 1);

        await this.prisma.emailReportConfig.update({
          where: { id: config.id },
          data: {
            lastSent: new Date(),
            nextSend,
          },
        });
      } catch (error) {
        this.logger.error(
          `Failed to process report config ${config.id}:`,
          error,
        );
        await this.logReportExecution(
          config.id,
          'FAILED',
          config.format,
          error.message,
        );
      }
    }
  }

  @Cron(CronExpression.EVERY_WEEK)
  async handleWeeklyReports() {
    this.logger.log('Starting weekly email reports processing');

    const activeConfigs = await this.prisma.emailReportConfig.findMany({
      where: {
        isActive: true,
        frequency: 'WEEKLY',
        nextSend: { lte: new Date() },
      },
      include: { recipients: true, store: true },
    });

    for (const config of activeConfigs) {
      try {
        await this.processReportConfig(config, 'week');

        // Update next send time
        const nextSend = new Date();
        nextSend.setDate(nextSend.getDate() + 7);

        await this.prisma.emailReportConfig.update({
          where: { id: config.id },
          data: {
            lastSent: new Date(),
            nextSend,
          },
        });
      } catch (error) {
        this.logger.error(
          `Failed to process report config ${config.id}:`,
          error,
        );
        await this.logReportExecution(
          config.id,
          'FAILED',
          config.format,
          error.message,
        );
      }
    }
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_NOON)
  async handleMonthlyReports() {
    this.logger.log('Starting monthly email reports processing');

    const activeConfigs = await this.prisma.emailReportConfig.findMany({
      where: {
        isActive: true,
        frequency: 'MONTHLY',
        nextSend: { lte: new Date() },
      },
      include: { recipients: true, store: true },
    });

    for (const config of activeConfigs) {
      try {
        await this.processReportConfig(config, 'month');

        // Update next send time
        const nextSend = new Date();
        nextSend.setMonth(nextSend.getMonth() + 1);

        await this.prisma.emailReportConfig.update({
          where: { id: config.id },
          data: {
            lastSent: new Date(),
            nextSend,
          },
        });
      } catch (error) {
        this.logger.error(
          `Failed to process report config ${config.id}:`,
          error,
        );
        await this.logReportExecution(
          config.id,
          'FAILED',
          config.format,
          error.message,
        );
      }
    }
  }

  private async processReportConfig(
    config: any,
    period: 'day' | 'week' | 'month' = 'day',
  ) {
    const startTime = Date.now();

    try {
      // Collect report data
      const reportData = await this.generateReportData(
        config.storeId,
        period,
        config.store.name,
      );

      // Generate report based on format
      let attachment: { filename: string; content: Buffer } | null = null;

      switch (config.format) {
        case 'PDF':
          attachment = await this.generatePDFReport(reportData, config.name);
          break;
        case 'CSV':
          attachment = await this.generateCSVReport(reportData, config.name);
          break;
        case 'HTML':
          // HTML reports are sent as the email body
          break;
      }

      // Send emails to all recipients
      const activeRecipients = config.recipients.filter((r: any) => r.isActive);
      const emailResults = await Promise.allSettled(
        activeRecipients.map((recipient: any) =>
          this.sendReportEmail(
            recipient,
            config,
            reportData,
            attachment,
            period,
          ),
        ),
      );

      // Log execution
      const successCount = emailResults.filter(
        (r) => r.status === 'fulfilled',
      ).length;
      const status =
        successCount === activeRecipients.length ? 'SUCCESS' : 'PARTIAL';

      await this.logReportExecution(
        config.id,
        status,
        config.format,
        status === 'PARTIAL' ? 'Some recipients failed' : undefined,
        Date.now() - startTime,
      );
    } catch (error) {
      throw error;
    }
  }

  private async generateReportData(
    storeId: string,
    period: 'day' | 'week' | 'month',
    storeName: string,
  ): Promise<ReportData> {
    const [metrics, geographicData, salesTrend] = await Promise.all([
      this.dashboardService.getRealTimeMetrics(storeId),
      this.dashboardService.getGeographicDistribution(storeId),
      this.dashboardService.getSalesTrend(storeId, period),
    ]);

    return {
      ...metrics,
      geographicDistribution: geographicData,
      salesTrend,
      period: period.toUpperCase(),
      storeName,
    };
  }

  private async generatePDFReport(
    data: ReportData,
    reportName: string,
  ): Promise<{ filename: string; content: Buffer }> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve({
            filename: `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
            content: pdfBuffer,
          });
        });

        // PDF content generation
        doc
          .fontSize(20)
          .text(`${data.storeName} - ${data.period} Report`, 50, 50);
        doc
          .fontSize(12)
          .text(`Generated: ${new Date().toLocaleString()}`, 50, 80);

        // Financial Summary
        doc.fontSize(16).text('Financial Summary', 50, 120);
        doc.fontSize(12).text(`Revenue: ₦${data.revenue.toFixed(2)}`, 50, 140);
        doc.text(`Revenue Change: ${data.revenueChange.toFixed(2)}%`, 50, 155);
        doc.text(`Transactions: ${data.transactions}`, 50, 170);
        doc.text(
          `Average Transaction Value: ₦${data.averageTransactionValue.toFixed(2)}`,
          50,
          185,
        );
        doc.text(`Total Customers: ${data.totalCustomers}`, 50, 200);
        doc.text(`Active Shifts: ${data.activeShifts}`, 50, 215);

        // Top Products Section
        doc.fontSize(16).text('Top Performing Products', 50, 250);
        let productY = 270;
        data.topProducts.slice(0, 5).forEach((product, index) => {
          doc.fontSize(10).text(`${index + 1}. ${product.name}`, 50, productY);
          doc.text(`${product.quantity} units`, 250, productY);
          doc.text(`₦${product.revenue.toFixed(2)}`, 350, productY);
          productY += 15;
        });

        // Geographic Distribution Section
        doc
          .fontSize(16)
          .text('Geographic Sales Distribution', 50, productY + 20);
        let geoY = productY + 40;
        data.geographicDistribution.slice(0, 5).forEach((region, index) => {
          doc.fontSize(10).text(`${index + 1}. ${region.region}`, 50, geoY);
          doc.text(`₦${region.sales.toFixed(2)}`, 250, geoY);
          doc.text(`${region.customers} customers`, 350, geoY);
          geoY += 15;
        });

        // Sales Trend Section
        doc.fontSize(16).text('Sales Trend Overview', 50, geoY + 20);
        let trendY = geoY + 40;
        const recentTrends = data.salesTrend.slice(-7); // Last 7 days
        recentTrends.forEach((trend, index) => {
          const dateStr = trend.date.toLocaleDateString();
          doc.fontSize(10).text(dateStr, 50, trendY);
          doc.text(`₦${trend.revenue.toFixed(2)}`, 150, trendY);
          doc.text(`${trend.transactions} transactions`, 250, trendY);
          trendY += 15;
        });

        // Performance Insights
        doc.fontSize(14).text('Performance Insights', 50, trendY + 20);
        doc.fontSize(10);

        const insightsY = trendY + 40;
        if (data.revenueChange > 0) {
          doc.text(
            `✓ Revenue increased by ${data.revenueChange.toFixed(2)}% compared to previous period`,
            50,
            insightsY,
          );
        } else if (data.revenueChange < 0) {
          doc.text(
            `⚠ Revenue decreased by ${Math.abs(data.revenueChange).toFixed(2)}% compared to previous period`,
            50,
            insightsY,
          );
        } else {
          doc.text(
            `→ Revenue remained stable compared to previous period`,
            50,
            insightsY,
          );
        }

        if (data.averageTransactionValue > 1000) {
          doc.text(
            `✓ Strong average transaction value (₦${data.averageTransactionValue.toFixed(2)})`,
            50,
            insightsY + 15,
          );
        }

        if (data.topProducts.length > 0) {
          const topProduct = data.topProducts[0];
          doc.text(
            `✓ Top product: ${topProduct.name} (${topProduct.quantity} units, ₦${topProduct.revenue.toFixed(2)})`,
            50,
            insightsY + 30,
          );
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private async generateCSVReport(
    data: ReportData,
    reportName: string,
  ): Promise<{ filename: string; content: Buffer }> {
    const csvWriter = csv.createObjectCsvStringifier({
      header: [
        { id: 'metric', title: 'METRIC' },
        { id: 'value', title: 'VALUE' },
      ],
    });

    const records = [
      { metric: 'Revenue', value: `₦${data.revenue.toFixed(2)}` },
      { metric: 'Revenue Change', value: `${data.revenueChange.toFixed(2)}%` },
      { metric: 'Transactions', value: data.transactions.toString() },
      {
        metric: 'Average Transaction Value',
        value: `₦${data.averageTransactionValue.toFixed(2)}`,
      },
      { metric: 'Total Customers', value: data.totalCustomers.toString() },
      { metric: 'Active Shifts', value: data.activeShifts.toString() },
    ];

    const csvString =
      csvWriter.getHeaderString() + csvWriter.stringifyRecords(records);

    return {
      filename: `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`,
      content: Buffer.from(csvString, 'utf8'),
    };
  }

  private async sendReportEmail(
    recipient: any,
    config: any,
    data: ReportData,
    attachment: { filename: string; content: Buffer } | null,
    period: 'day' | 'week' | 'month',
  ) {
    const emailContent = this.generateEmailContent(data, config);

    const mailOptions: any = {
      to: recipient.email,
      subject: `${config.name} - ${data.period} Report`,
      html: emailContent,
    };

    if (attachment) {
      mailOptions.attachments = [
        {
          filename: attachment.filename,
          content: attachment.content,
        },
      ];
    }

    // Calculate inventory loss from adjustments
    const loss = await this.calculateInventoryLoss(config.storeId, period);

    await this.mailService.sendDailyReport(recipient.email, {
      revenue: data.revenue,
      loss: loss,
      flaggedShifts: data.activeShifts,
    });
  }

  private generateEmailContent(data: ReportData, config: any): string {
    return `
      <h1>${config.name} - ${data.period} Sales Report</h1>
      <h2>${data.storeName}</h2>
      <p><strong>Period:</strong> ${new Date().toLocaleDateString()}</p>
      
      <h3>Financial Summary</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td>Revenue:</td><td>₦${data.revenue.toFixed(2)}</td></tr>
        <tr><td>Revenue Change:</td><td>${data.revenueChange.toFixed(2)}%</td></tr>
        <tr><td>Transactions:</td><td>${data.transactions}</td></tr>
        <tr><td>Average Transaction Value:</td><td>₦${data.averageTransactionValue.toFixed(2)}</td></tr>
        <tr><td>Total Customers:</td><td>${data.totalCustomers}</td></tr>
        <tr><td>Active Shifts:</td><td>${data.activeShifts}</td></tr>
      </table>
      
      <h3>Top Products</h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${data.topProducts
          .map(
            (product) => `
          <tr>
            <td>${product.name}</td>
            <td>${product.quantity} units</td>
            <td>₦${product.revenue.toFixed(2)}</td>
          </tr>
        `,
          )
          .join('')}
      </table>
      
      <p>This is an automated report generated by EmmyPos.</p>
    `;
  }

  private async logReportExecution(
    configId: string,
    status: string,
    format: ReportFormat,
    error?: string,
    duration?: number,
  ) {
    const config = await this.prisma.emailReportConfig.findUnique({
      where: { id: configId },
      include: { recipients: true },
    });

    if (!config) return;

    await this.prisma.reportExecutionLog.create({
      data: {
        configId,
        status,
        format,
        recipients: config.recipients
          .filter((r) => r.isActive)
          .map((r) => r.email),
        error,
        duration,
      },
    });
  }

  async manualReportTrigger(configId: string) {
    const config = await this.prisma.emailReportConfig.findUnique({
      where: { id: configId },
      include: { recipients: true, store: true },
    });

    if (!config || !config.isActive) {
      throw new Error('Report configuration not found or inactive');
    }

    await this.processReportConfig(config);
  }

  private async calculateInventoryLoss(
    storeId: string,
    period: 'day' | 'week' | 'month',
  ): Promise<number> {
    // Calculate the date range based on the period
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
    }

    // Calculate total value of inventory adjustments in the period
    const adjustments = await this.prisma.inventoryAdjustment.findMany({
      where: {
        storeId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        material: true,
      },
    });

    // Calculate total loss based on adjustment quantities and material costs
    // For now, we'll just calculate the absolute value of adjustments
    // In a real system, you might want to factor in the cost of materials
    const totalLoss = adjustments.reduce((sum, adjustment) => {
      // Convert Decimal to number for comparison and calculation
      const qty = Number(adjustment.quantity);
      // Assuming negative adjustments represent losses
      return sum + (qty < 0 ? Math.abs(qty) : qty);
    }, 0);

    return totalLoss;
  }
}
