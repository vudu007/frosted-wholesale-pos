import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async login(dto: { username: string; pass: string }) {
    // 1. Find the user by their username
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
      include: { store: true },
    });

    // 2. Check if the user exists AND if the password matches
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.pass, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. If credentials are correct, create the JWT payload
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      storeId: user.storeId,
    };

    // 4. Sign the token and return it along with user info
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        storeId: user.storeId,
      },
    };
  }

  async forgotPassword(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resetToken = randomBytes(32).toString('hex');
    const passwordResetToken = await bcrypt.hash(resetToken, 10);
    const passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken,
        passwordResetExpires,
      },
    });

    try {
      // In a real app, you'd get the user's email. Here we'll just log it.
      // In a real app, you'd get the user's email from the user record
      // For now, we'll just use a placeholder since users don't have email addresses in the schema
      // await this.mailService.sendPasswordResetEmail(user.email || 'user@example.com', resetToken);
      console.log(`Password reset token for ${username}: ${resetToken}`);
      return { message: 'Password reset email sent' };
    } catch (error) {
      console.error(error);
      throw new Error('Error sending password reset email');
    }
  }

  async resetPassword(token: string, pass: string) {
    // The token was already hashed when stored, so we just need to compare with the stored hash
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Password reset token is invalid or has expired',
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(pass, salt);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return { message: 'Password has been reset' };
  }

  async verifyPassword(userId: string, pass: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Incorrect password');
    }

    return { success: true };
  }
}
