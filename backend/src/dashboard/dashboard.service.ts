import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getRealTimeMetrics(storeId: string) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      todaySales,
      yesterdaySales,
      topProducts,
      totalCustomers,
      activeShifts,
    ] = await Promise.all([
      // Today's sales
      this.prisma.sale.aggregate({
        where: { storeId, createdAt: { gte: today } },
        _sum: { grandTotal: true },
        _count: { id: true },
      }),

      // Yesterday's sales (for comparison)
      this.prisma.sale.aggregate({
        where: {
          storeId,
          createdAt: {
            gte: new Date(today.getTime() - 24 * 60 * 60 * 1000),
            lt: today,
          },
        },
        _sum: { grandTotal: true },
      }),

      // Top selling products (last 7 days)
      this.prisma.saleItem.groupBy({
        by: ['productId'],
        where: {
          sale: {
            storeId,
            createdAt: {
              gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        },
        _sum: { qty: true },
        orderBy: { _sum: { qty: 'desc' } },
        take: 5,
      }),

      // Total customers
      this.prisma.customer.count({ where: { storeId } }),

      // Active shifts
      this.prisma.cashShift.count({
        where: { storeId, status: 'OPEN' },
      }),
    ]);

    // Calculate revenue change
    const currentRevenue = Number(todaySales._sum.grandTotal || 0);
    const previousRevenue = Number(yesterdaySales._sum.grandTotal || 0);
    const revenueChange =
      previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : currentRevenue > 0
          ? 100
          : 0;

    // Get product names for top products
    const topProductsWithNames = await Promise.all(
      topProducts.map(async (item) => {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
        });
        return {
          name: product?.name || 'Unknown Product',
          quantity: item._sum.qty || 0,
          revenue: (item._sum.qty || 0) * Number(product?.price || 0),
        };
      }),
    );

    return {
      revenue: currentRevenue,
      revenueChange: Math.round(revenueChange * 100) / 100,
      transactions: todaySales._count.id || 0,
      averageTransactionValue:
        todaySales._count.id > 0 ? currentRevenue / todaySales._count.id : 0,
      topProducts: topProductsWithNames,
      totalCustomers,
      activeShifts,
      timestamp: now,
    };
  }

  async getSalesTrend(
    storeId: string,
    period: 'day' | 'week' | 'month' = 'day',
  ) {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          now.getDate(),
        );
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const salesData = await this.prisma.sale.groupBy({
      by: ['createdAt'],
      where: {
        storeId,
        createdAt: { gte: startDate },
      },
      _sum: { grandTotal: true },
      _count: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    return salesData.map((item) => ({
      date: item.createdAt,
      revenue: Number(item._sum.grandTotal || 0),
      transactions: item._count.id,
    }));
  }

  async getGeographicDistribution(storeId: string) {
    // Get the store location to determine the primary region
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { location: true },
    });

    // Extract customers with addresses for geographic analysis
    const customers = await this.prisma.customer.findMany({
      where: { storeId, address: { not: null } },
      select: { id: true, address: true },
    });

    // Get sales data for the last 30 days
    const salesData = await this.prisma.sale.findMany({
      where: {
        storeId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      include: {
        customer: {
          select: { address: true },
        },
      },
    });

    // Extract regions from addresses
    const regionMap = new Map<
      string,
      { sales: number; customers: Set<string> }
    >();

    // Add store's primary region
    const primaryRegion = this.extractRegionFromAddress(store?.location || '');
    if (primaryRegion) {
      regionMap.set(primaryRegion, { sales: 0, customers: new Set() });
    }

    // Process sales data by region
    salesData.forEach((sale) => {
      const customerAddress = sale.customer?.address || '';
      const region =
        this.extractRegionFromAddress(customerAddress) ||
        primaryRegion ||
        'Unknown';

      if (!regionMap.has(region)) {
        regionMap.set(region, { sales: 0, customers: new Set() });
      }

      const regionData = regionMap.get(region)!;
      regionData.sales += Number(sale.grandTotal || 0);

      if (sale.customerId) {
        regionData.customers.add(sale.customerId);
      }
    });

    // Convert to the required format
    const result = Array.from(regionMap.entries()).map(([region, data]) => ({
      region,
      sales: Math.round(data.sales),
      customers: data.customers.size,
    }));

    // If no geographic data found, fall back to store location
    if (result.length === 0 && primaryRegion) {
      const totalRevenue = await this.prisma.sale.aggregate({
        where: {
          storeId,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        _sum: { grandTotal: true },
      });

      const totalCustomers = await this.prisma.customer.count({
        where: { storeId },
      });

      return [
        {
          region: primaryRegion,
          sales: Math.round(Number(totalRevenue._sum.grandTotal || 0)),
          customers: totalCustomers,
        },
      ];
    }

    return result;
  }

  private extractRegionFromAddress(address: string): string | null {
    if (!address) return null;

    // Common Nigerian regions/cities to look for in addresses
    const regions = [
      'Lagos',
      'Abuja',
      'Port Harcourt',
      'Ibadan',
      'Kano',
      'Kaduna',
      'Benin',
      'Maiduguri',
      'Zaria',
      'Enugu',
      'Aba',
      'Jos',
      'Ilorin',
      'Oyo',
      'Akure',
      'Sokoto',
      'Calabar',
      'Uyo',
      'Owerri',
      'Warri',
      'Abeokuta',
      'Ado Ekiti',
      'Makurdi',
      'Minna',
      'Lokoja',
      'Asaba',
    ];

    const addressLower = address.toLowerCase();

    for (const region of regions) {
      if (addressLower.includes(region.toLowerCase())) {
        return region;
      }
    }

    // If no specific region found, try to extract state information
    const stateMatch = address.match(
      /\b(?:Lagos|Abuja|Rivers|Oyo|Kano|Kaduna|Edo|Borno|Plateau|Enugu|Imo|Delta|Ogun|Ekiti|Benue|Niger|Kogi|Anambra|Bayelsa|Cross River|Akwa Ibom|Osun|Kwara|Nasarawa|Sokoto|Kebbi|Jigawa|Yobe|Gombe|Taraba|Adamawa|Bauchi|Zamfara|Ebonyi)\b/i,
    );
    if (stateMatch) {
      return stateMatch[0];
    }

    return null;
  }

  async refreshDashboard(storeId: string) {
    return await this.getRealTimeMetrics(storeId);
  }
}
