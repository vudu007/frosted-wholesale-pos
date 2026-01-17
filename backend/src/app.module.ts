import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config'; // Import the ConfigModule

// Default App Controller & Service
import { AppController } from './app.controller';
import { AppService } from './app.service';

// --- Our Feature Modules ---
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { RawMaterialsModule } from './raw-materials/raw-materials.module';
import { SalesModule } from './sales/sales.module';
import { ShiftsModule } from './shifts/shifts.module';
import { ReportsModule } from './reports/reports.module';
import { InventoryAdjustmentsModule } from './inventory-adjustments/inventory-adjustments.module';
import { MailModule } from './mail/mail.module';
import { SettingsModule } from './settings/settings.module';
import { CustomersModule } from './customers/customers.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EmailReportsModule } from './email-reports/email-reports.module';
import { MaterialAllocationsModule } from './material-allocations/material-allocations.module';
import { UploadsModule } from './uploads/uploads.module';
import { StoresModule } from './stores/stores.module';

// --- Services for Cron Jobs & Database ---
import { TasksService } from './tasks/tasks.service';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    // 1. Configure and enable environment variables (.env file) globally
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Enable the scheduler for automated tasks
    ScheduleModule.forRoot(),

    // 3. Import all the feature modules for our application
    AuthModule,
    UsersModule,
    ProductsModule,
    RawMaterialsModule,
    SalesModule,
    ShiftsModule,
    ReportsModule,
    InventoryAdjustmentsModule,
    MailModule,
    SettingsModule,
    CustomersModule,
    DashboardModule,
    EmailReportsModule,
    MaterialAllocationsModule,
    UploadsModule,
    StoresModule,
  ],
  controllers: [
    // The main entry controller for the root path
    AppController,
  ],
  providers: [
    // The default app service
    AppService,

    // The service that runs our scheduled tasks (e.g., daily reports)
    // It's provided here at the root level so the ScheduleModule can find it.
    TasksService,

    // PrismaService must be provided here so the TasksService can use it.
    PrismaService,
  ],
})
export class AppModule {}
