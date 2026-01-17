import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Setting } from '@prisma/client';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  // Finds the one-and-only settings row, creating it if it doesn't exist.
  async getSettings(): Promise<Setting> {
    const settings = await this.prisma.setting.findUnique({
      where: { id: 1 },
    });

    // If no settings exist yet, create the default entry.
    if (!settings) {
      return this.prisma.setting.create({
        data: { id: 1, businessName: 'EmmyPos' },
      });
    }
    return settings;
  }

  // Updates the settings. 'upsert' is perfect for this: it updates if id:1 exists, or creates it if not.
  async updateSettings(dto: {
    businessName?: string;
    businessAddress?: string;
    reportEmail?: string;
    emailHost?: string;
    emailPort?: number;
    emailUser?: string;
    emailPass?: string;
    emailSecure?: boolean;
    currency?: string;
  }): Promise<Setting> {
    return this.prisma.setting.upsert({
      where: { id: 1 },
      update: {
        businessName: dto.businessName,
        businessAddress: dto.businessAddress,
        reportEmail: dto.reportEmail,
        emailHost: dto.emailHost,
        emailPort: dto.emailPort,
        emailUser: dto.emailUser,
        emailPass: dto.emailPass,
        emailSecure: dto.emailSecure,
        currency: dto.currency,
      },
      create: {
        id: 1,
        businessName: dto.businessName,
        businessAddress: dto.businessAddress,
        reportEmail: dto.reportEmail,
        emailHost: dto.emailHost,
        emailPort: dto.emailPort,
        emailUser: dto.emailUser,
        emailPass: dto.emailPass,
        emailSecure: dto.emailSecure || false,
        currency: dto.currency || '₦',
      },
    });
  }

  // Specifically updates just the logo URL.
  async updateLogoUrl(logoUrl: string): Promise<Setting> {
    return this.prisma.setting.upsert({
      where: { id: 1 },
      update: { logoUrl },
      create: { id: 1, logoUrl },
    });
  }
}
