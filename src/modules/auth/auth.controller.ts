import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  ForbiddenException,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Request as ExpressRequest } from 'express';

interface JwtUser {
  id: string;
  email: string;
  role: string;
}

interface AuthenticatedRequest extends ExpressRequest {
  user: JwtUser;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.validateUser(body.email, body.password);
  }

  @Post('admin-login')
  async adminLogin(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUserRaw(
      body.email,
      body.password,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const role = (user.role || '').toString().toLowerCase();
    console.log('DEBUG normalized role:', role);

    if (role !== 'admin') {
      throw new ForbiddenException('Only admins can log in here');
    }

    return this.authService.login(user);
  }

  @Post('send-otp')
  async sendOtp(@Body('email') email: string) {
    return this.authService.sendOtp(email);
  }

  @Post('verify-otp')
  async verifyOtp(
    @Body() body: { email: string; otp: string; userData: RegisterAuthDto },
  ) {
    return this.authService.verifyOtp(body.email, body.otp, body.userData);
  }

  @Post('resend-otp')
  async resendOtp(@Body('email') email: string) {
    return this.authService.resendOtp(email);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Req() req: AuthenticatedRequest) {
    return this.authService.getProfile(req.user.id);
  }
}
