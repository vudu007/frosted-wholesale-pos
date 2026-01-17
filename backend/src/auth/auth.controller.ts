import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() signInDto: { username: string; pass: string }) {
    return this.authService.login(signInDto);
  }

  @Post('forgot-password')
  forgotPassword(@Body('username') username: string) {
    return this.authService.forgotPassword(username);
  }

  @Post('reset-password')
  resetPassword(@Body() body: { token: string; pass: string }) {
    return this.authService.resetPassword(body.token, body.pass);
  }

  @Post('verify-password')
  verifyPassword(@Body() body: { userId: string; pass: string }) {
    return this.authService.verifyPassword(body.userId, body.pass);
  }
}
