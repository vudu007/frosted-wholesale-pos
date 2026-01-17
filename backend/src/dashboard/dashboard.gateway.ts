import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, replace with your frontend URL
    methods: ['GET', 'POST'],
  },
})
export class DashboardGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger = new Logger(DashboardGateway.name);
  private connectedClients: Map<string, { storeId: string; client: Socket }> =
    new Map();

  constructor(private dashboardService: DashboardService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    // Client will send storeId after connection
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('join-store')
  async handleJoinStore(
    client: Socket,
    @MessageBody() data: { storeId: string },
  ) {
    this.connectedClients.set(client.id, { storeId: data.storeId, client });
    this.logger.log(`Client ${client.id} joined store ${data.storeId}`);

    // Send initial dashboard data
    await this.sendDashboardUpdate(data.storeId);
  }

  @SubscribeMessage('request-dashboard-update')
  async handleRequestUpdate(
    client: Socket,
    @MessageBody() data: { storeId: string },
  ) {
    await this.sendDashboardUpdate(data.storeId);
  }

  async sendDashboardUpdate(storeId: string) {
    try {
      const [metrics, salesTrend, geographicDistribution] = await Promise.all([
        this.dashboardService.getRealTimeMetrics(storeId),
        this.dashboardService.getSalesTrend(storeId, 'day'),
        this.dashboardService.getGeographicDistribution(storeId),
      ]);

      this.server.to(this.getRoomName(storeId)).emit('dashboard-update', {
        metrics,
        salesTrend,
        geographicDistribution,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(
        `Error sending dashboard update for store ${storeId}:`,
        error,
      );
    }
  }

  async broadcastNewSale(storeId: string, saleData: any) {
    this.server.to(this.getRoomName(storeId)).emit('new-sale', {
      sale: saleData,
      timestamp: new Date().toISOString(),
    });

    // Also update the dashboard
    await this.sendDashboardUpdate(storeId);
  }

  async broadcastOrderUpdate(storeId: string, orderData: any) {
    this.server.to(this.getRoomName(storeId)).emit('order-update', {
      order: orderData,
      timestamp: new Date().toISOString(),
    });
  }

  async broadcastShiftUpdate(storeId: string, shiftData: any) {
    this.server.to(this.getRoomName(storeId)).emit('shift-update', {
      shift: shiftData,
      timestamp: new Date().toISOString(),
    });

    // Update dashboard metrics
    await this.sendDashboardUpdate(storeId);
  }

  private getRoomName(storeId: string): string {
    return `store-${storeId}`;
  }

  // Method to be called by other services when data changes
  async notifyDataChanged(storeId: string) {
    await this.sendDashboardUpdate(storeId);
  }
}
