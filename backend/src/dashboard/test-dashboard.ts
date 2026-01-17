// Simple test script to verify dashboard service functionality
import { PrismaService } from '../prisma.service';
import { DashboardService } from './dashboard.service';

async function testDashboard() {
  const prisma = new PrismaService();
  const dashboardService = new DashboardService(prisma);

  try {
    // Test with a sample store ID - you'll need to replace this with an actual store ID from your database
    const storeId = 'your-actual-store-id-here';

    console.log('Testing Dashboard Service...');

    // Test real-time metrics
    const metrics = await dashboardService.getRealTimeMetrics(storeId);
    console.log('Real-time Metrics:', metrics);

    // Test sales trend
    const salesTrend = await dashboardService.getSalesTrend(storeId, 'day');
    console.log('Sales Trend:', salesTrend);

    // Test geographic distribution
    const geographicDistribution =
      await dashboardService.getGeographicDistribution(storeId);
    console.log('Geographic Distribution:', geographicDistribution);

    console.log('Dashboard service test completed successfully!');
  } catch (error) {
    console.error('Error testing dashboard service:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Uncomment the line below to run the test
// testDashboard();
