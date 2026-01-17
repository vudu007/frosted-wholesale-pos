import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class ShiftsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  // Function to start a new shift
  async startShift(dto: {
    userId: string;
    storeId: string;
    openingCash: number;
  }) {
    return await this.prisma.cashShift.create({
      data: {
        cashierId: dto.userId,
        storeId: dto.storeId,
        startCash: dto.openingCash,
        status: 'OPEN',
      },
    });
  }

  // Original function for manual (blind count) Z-Out
  async endShift(shiftId: string, closingCash: number) {
    const shift = await this.prisma.cashShift.findUnique({
      where: { id: shiftId },
      include: { cashier: true },
    });
    if (!shift || shift.status === 'CLOSED')
      throw new NotFoundException('Shift not found or already closed');

    const sales = await this.prisma.sale.aggregate({
      where: { storeId: shift.storeId, createdAt: { gte: shift.startTime } },
      _sum: { grandTotal: true },
    });
    const totalSales = Number(sales._sum.grandTotal || 0);
    const expectedCash = Number(shift.startCash) + totalSales;
    const variance = closingCash - expectedCash;

    const updatedShift = await this.prisma.cashShift.update({
      where: { id: shiftId },
      data: {
        endTime: new Date(),
        systemCash: expectedCash,
        actualCash: closingCash,
        variance: variance,
        status: Math.abs(variance) > 1 ? 'FLAGGED' : 'CLOSED',
      },
      include: { cashier: true },
    });

    // Send end of sales report if configured
    await this.handleZOutEmail(updatedShift);

    return updatedShift;
  }

  // --- NEW: Function for Fully Automatic Z-Out ---
  async autoEndShift(shiftId: string) {
    const shift = await this.prisma.cashShift.findUnique({
      where: { id: shiftId },
      include: { cashier: true },
    });
    if (!shift || shift.status === 'CLOSED')
      throw new NotFoundException('Shift not found or already closed');

    const sales = await this.prisma.sale.aggregate({
      where: { storeId: shift.storeId, createdAt: { gte: shift.startTime } },
      _sum: { grandTotal: true },
    });
    const totalSales = Number(sales._sum.grandTotal || 0);
    const expectedCash = Number(shift.startCash) + totalSales;

    const updatedShift = await this.prisma.cashShift.update({
      where: { id: shiftId },
      data: {
        endTime: new Date(),
        systemCash: expectedCash,
        actualCash: expectedCash,
        variance: 0,
        status: 'CLOSED',
      },
      include: { cashier: true },
    });

    // Send end of sales report if configured
    await this.handleZOutEmail(updatedShift);

    return updatedShift;
  }

  private async handleZOutEmail(shift: any) {
    const settings = await this.prisma.setting.findUnique({ where: { id: 1 } });
    if (settings?.reportEmail) {
      await this.mailService.sendZOutReport(settings.reportEmail, shift);
    }
  }
}
