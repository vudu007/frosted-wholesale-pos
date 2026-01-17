import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { MailService } from '../mail/mail.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private settingsService: SettingsService,
  ) {}

  /**
   * This is a scheduled task that runs automatically every day at midnight.
   * It compiles a daily financial report and emails it to the manager.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'dailySalesReport',
    timeZone: 'Africa/Lagos', // Example: Set to your business's time zone
  })
  async handleDailyReport() {
    this.logger.log('Running Daily Sales Report Task...');

    // Step 1: Fetch the manager's email from the settings in the database.
    const settings = await this.settingsService.getSettings();
    if (!settings.reportEmail) {
      this.logger.warn(
        'No report email is configured in settings. Skipping daily report.',
      );
      return; // Stop the task if no email is set.
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to the beginning of the current day

    // Step 2: Calculate total revenue for the day.
    const sales = await this.prisma.sale.aggregate({
      where: { createdAt: { gte: today } },
      _sum: { grandTotal: true },
    });

    // Step 3: Calculate total loss from inventory adjustments (spoilage, damage, etc.).
    const adjustments = await this.prisma.inventoryAdjustment.findMany({
      where: { createdAt: { gte: today } },
    });
    // This is a simplified loss calculation. A real system would use cost-of-goods.
    const loss = adjustments.reduce((sum, adj) => {
      const itemCost = 500; // Placeholder average cost per item/unit
      // We multiply by -1 because spoilage is stored as a negative number.
      return sum + Number(adj.quantity) * -1 * itemCost;
    }, 0);

    // Step 4: Count the number of shifts that were flagged for variance.
    const flaggedShifts = await this.prisma.cashShift.count({
      where: {
        status: 'FLAGGED',
        endTime: { gte: today },
      },
    });

    // Step 5: Assemble the report object.
    const report = {
      revenue: sales._sum.grandTotal || 0,
      loss: loss,
      flaggedShifts: flaggedShifts,
    };

    // Step 6: Send the compiled report via email.
    await this.mailService.sendDailyReport(settings.reportEmail, report);

    this.logger.log('Daily Sales Report Task finished successfully.');
  }
}
