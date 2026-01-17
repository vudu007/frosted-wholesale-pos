import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Calculate Revenue (Today) - CORRECTED
    const sales = await this.prisma.sale.aggregate({
      where: { createdAt: { gte: today } },
      _sum: { grandTotal: true }, // Use grandTotal
    });

    // 2. Count Flagged Shifts
    const flaggedShifts = await this.prisma.cashShift.count({
      where: { status: 'FLAGGED' },
    });

    // 3. Count Low Stock
    const lowStock = await this.prisma.rawMaterialInventory.count({
      where: { stock: { lt: 10 } },
    });

    // 4. Get Recent Activity
    const recentActivity = await this.prisma.cashShift.findMany({
      take: 5,
      orderBy: { startTime: 'desc' },
      where: { status: { not: 'OPEN' } },
      include: { cashier: true },
    });

    return {
      revenue: Number(sales._sum.grandTotal || 0), // Use grandTotal
      flagged: flaggedShifts,
      lowStock: lowStock,
      recent: recentActivity,
      salesTrend: await this.getSalesTrend(),
    };
  }

  private async getSalesTrend() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // Go back 6 days + today = 7 days
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const sales = await this.prisma.sale.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, grandTotal: true },
    });

    const trendMap = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      trendMap.set(key, 0);
    }

    sales.forEach((sale) => {
      const key = sale.createdAt.toISOString().split('T')[0];
      if (trendMap.has(key)) {
        trendMap.set(key, (trendMap.get(key) || 0) + Number(sale.grandTotal));
      }
    });

    return Array.from(trendMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getDemandForecast(storeId?: string) {
    // 1. Get all products with inventory (filtered by storeId if provided)
    const products = await this.prisma.product.findMany({
      include: {
        inventory: {
          where: storeId ? { storeId } : undefined,
        },
      },
    });

    // 2. Get Sales from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesItems = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: {
          createdAt: { gte: thirtyDaysAgo },
          storeId: storeId || undefined,
        },
      },
      _sum: { qty: true },
    });

    // Map sales qty for quick lookup
    const salesMap = new Map<string, number>();
    salesItems.forEach((item) =>
      salesMap.set(item.productId, item._sum.qty || 0),
    );

    // 3. Calculate Metrics
    const forecast = products.map((p) => {
      const currentStock = p.inventory.reduce((sum, inv) => sum + inv.stock, 0); // Sum across stores if no storeId, or just single store
      const soldLast30Days = salesMap.get(p.id) || 0;
      const avgDailySales = soldLast30Days / 30;

      // Avoid division by zero
      const daysRemaining =
        avgDailySales > 0
          ? Math.floor(currentStock / avgDailySales)
          : currentStock > 0
            ? 999
            : 0; // If stock exists but no sales, it lasts "forever". If no stock no sales, 0 days.

      // Suggest restock if running out in < 7 days
      // Goal: Maintain 14 days of stock buffer
      const targetStock = Math.ceil(avgDailySales * 14);
      const suggestedRestock =
        targetStock > currentStock ? targetStock - currentStock : 0;

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        currentStock,
        soldLast30Days,
        avgDailySales: Number(avgDailySales.toFixed(2)),
        daysRemaining: daysRemaining > 365 ? 365 : daysRemaining, // Cap at 365 for display
        status:
          daysRemaining < 3 ? 'CRITICAL' : daysRemaining < 7 ? 'LOW' : 'GOOD',
        suggestedRestock,
      };
    });

    // Sort by risk (Critical first)
    return forecast.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }

  async getRecentSales(limit: number = 20) {
    const sales = await this.prisma.sale.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
        customer: true,
        store: true,
      },
    });

    return sales.map((sale) => ({
      id: sale.id,
      createdAt: sale.createdAt,
      grandTotal: Number(sale.grandTotal),
      subtotal: Number(sale.subtotal),
      taxAmount: Number(sale.taxAmount),
      discountAmount: sale.discountAmount ? Number(sale.discountAmount) : null,
      discountType: sale.discountType,
      customer: sale.customer
        ? {
            name: `${sale.customer.firstName} ${sale.customer.lastName}`,
            tier: sale.customer.tier,
          }
        : null,
      items: sale.items.map((item) => ({
        productName: item.product.name,
        quantity: item.qty,
        price: Number(item.price),
        total: Number(item.price) * item.qty,
      })),
      payments: sale.payments.map((payment) => ({
        type: payment.paymentType,
        amount: Number(payment.amount),
      })),
      storeName: sale.store.name,
    }));
  }

  async getSalesByDate() {
    try {
      const sales = await this.prisma.sale.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          payments: true,
        },
      });

      const grouped = new Map<string, any>();

      sales.forEach((sale) => {
        const date = sale.createdAt.toISOString().split('T')[0];
        if (!grouped.has(date)) {
          grouped.set(date, {
            date: date,
            count: 0,
            revenue: 0,
            tax: 0,
            discount: 0,
            sales: [],
          });
        }

        const group = grouped.get(date);
        group.count += 1;
        group.revenue += Number(sale.grandTotal || 0);
        group.tax += Number(sale.taxAmount || 0);
        group.discount += Number(sale.discountAmount || 0);
        group.sales.push({
          id: sale.id,
          createdAt: sale.createdAt,
          total: Number(sale.grandTotal || 0),
        });
      });

      return Array.from(grouped.values()).sort((a, b) =>
        b.date.localeCompare(a.date),
      );
    } catch (error) {
      console.error('Error in getSalesByDate:', error);
      throw error;
    }
  }
}
