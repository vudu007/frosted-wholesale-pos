import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma.service';

@Injectable()
export class MailService {
  private transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  private async getTransporter() {
    // 1. Try to get universal settings from the database first
    const settings = await this.prisma.setting.findUnique({ where: { id: 1 } });

    if (settings?.emailHost && settings?.emailUser && settings?.emailPass) {
      this.logger.debug('Using Universal SMTP Settings from Database');
      return nodemailer.createTransport({
        host: settings.emailHost,
        port: settings.emailPort || 587,
        secure: settings.emailSecure,
        auth: {
          user: settings.emailUser,
          pass: settings.emailPass,
        },
      });
    }

    // 2. Fallback to .env configuration
    this.logger.debug('Falling back to .env SMTP Settings');
    return nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: this.configService.get<string>('EMAIL_SECURE') === 'true',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });
  }

  /**
   * Sends a password reset email.
   */
  async sendPasswordResetEmail(email: string, token: string) {
    const transporter = await this.getTransporter();
    const settings = await this.prisma.setting.findUnique({ where: { id: 1 } });
    const businessName = settings?.businessName || 'EmmyPos';

    const resetLink = `http://localhost:5173/reset-password?token=${token}`;

    const html = `
      <div style="font-family: sans-serif; color: #333;">
        <h1 style="color: #4f46e5;">Password Reset Request</h1>
        <p>You requested a password reset for your ${businessName} account. Click the link below to reset your password:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">Reset Password</a>
        <p>If you did not request a password reset, please ignore this email.</p>
        <p style="font-size: 12px; color: #64748b; margin-top: 30px;">This is an automated system message. Please do not reply.</p>
      </div>
    `;

    try {
      const info = await transporter.sendMail({
        from: `"${businessName}" <${settings?.emailUser || this.configService.get('EMAIL_USER')}>`,
        to: email,
        subject: 'Password Reset Request',
        html,
      });

      this.logger.log(
        `Password reset email sent to ${email}. ID: ${info.messageId}`,
      );
      return info;
    } catch (e) {
      this.logger.error(
        `Failed to send password reset email to ${email}: ${e.message}`,
      );
      throw e;
    }
  }

  /**
   * Sends the Z-OUT end of shift sales report.
   */
  async sendZOutReport(recipient: string, shift: any) {
    const transporter = await this.getTransporter();
    const settings = await this.prisma.setting.findUnique({ where: { id: 1 } });
    const businessName = settings?.businessName || 'EmmyPos';

    const html = `
      <div style="font-family: sans-serif; color: #333;">
        <h1 style="color: #4f46e5;">End of Sales Report (Z-OUT)</h1>
        <p>A shift has been closed at <strong>${businessName}</strong>.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <h2 style="margin-top: 0; font-size: 18px;">Shift Summary</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Cashier:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${shift.cashier?.firstName} ${shift.cashier?.lastName}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Start Time:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${new Date(shift.startTime).toLocaleString()}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>End Time:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${new Date(shift.endTime).toLocaleString()}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Opening Cash:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">₦${Number(shift.startCash).toLocaleString()}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Expected Total:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">₦${Number(shift.systemCash).toLocaleString()}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Actual Total:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">₦${Number(shift.actualCash).toLocaleString()}</td></tr>
            <tr><td style="padding: 8px 0; color: ${Number(shift.variance) < 0 ? '#ef4444' : '#10b981'};"><strong>Variance:</strong></td><td style="padding: 8px 0; text-align: right; font-weight: bold; color: ${Number(shift.variance) < 0 ? '#ef4444' : '#10b981'};">₦${Number(shift.variance).toLocaleString()}</td></tr>
          </table>
        </div>
        
        <p style="font-size: 12px; color: #64748b; margin-top: 20px;">Requested by Automatic Z-OUT System.</p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: `"${businessName} Reporter" <${settings?.emailUser || this.configService.get('EMAIL_USER')}>`,
        to: recipient,
        subject: `Z-OUT Sales Report - ${businessName} - ${new Date().toLocaleDateString()}`,
        html,
      });
      this.logger.log(`Z-OUT report sent to ${recipient}`);
    } catch (e) {
      this.logger.error(`Failed to send Z-OUT report: ${e.message}`);
    }
  }

  /**
   * Sends the formatted daily sales report.
   */
  async sendDailyReport(recipient: string, report: any) {
    const transporter = await this.getTransporter();
    const settings = await this.prisma.setting.findUnique({ where: { id: 1 } });
    const businessName = settings?.businessName || 'EmmyPos';

    const reportDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const html = `
      <div style="font-family: sans-serif; color: #333;">
        <h1 style="color: #4f46e5;">Daily Financial Summary</h1>
        <p>Here is the summary for <strong>${businessName}</strong> on <strong>${reportDate}</strong>:</p>
        <table style="width: 100%; max-width: 400px; border-collapse: collapse; margin-top: 20px;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px 0;"><strong>Total Revenue:</strong></td>
            <td style="padding: 12px 0; text-align: right; font-weight: bold;">₦${Number(report.revenue).toLocaleString()}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px 0;"><strong>Inventory Loss (Shrinkage):</strong></td>
            <td style="padding: 12px 0; text-align: right; color: #ef4444;">₦${Number(report.loss).toLocaleString()}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px 0;"><strong>Flagged Shifts:</strong></td>
            <td style="padding: 12px 0; text-align: right; color: #f59e0b;">${report.flaggedShifts}</td>
          </tr>
        </table>
        <p style="font-size: 12px; color: #64748b; margin-top: 30px;">This an automated system report.</p>
      </div>
    `;

    try {
      const info = await transporter.sendMail({
        from: `"${businessName} Reporter" <${settings?.emailUser || this.configService.get('EMAIL_USER')}>`,
        to: recipient,
        subject: `${businessName} Daily Financial Report - ${reportDate}`,
        html,
      });
      this.logger.log(
        `Daily report successfully sent to ${recipient}. ID: ${info.messageId}`,
      );
    } catch (e) {
      this.logger.error(
        `Failed to send daily report to ${recipient}: ${e.message}`,
      );
    }
  }
}
