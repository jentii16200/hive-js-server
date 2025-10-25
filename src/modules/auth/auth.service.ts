import { Injectable, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { MailerService } from '../mailer/mailer.service';
import { RESPONSE } from 'src/utils/response.util';

@Injectable()
export class AuthService {
  private otpStore = new Map<string, { otp: string; expiresAt: number }>();

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailerService: MailerService,
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);
    console.log('DEBUG found user:', user);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isVerified) {
      throw new UnauthorizedException('Email not verified');
    }
    return this.login(user);
  }

  async validateUserRaw(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) return null;
    if (!user.isVerified && user.role.toLowerCase() !== 'admin') {
      return null;
    }
    return user;
  }

  async login(user: any) {
    try {
      const payload = { email: user.email, sub: user._id, role: user.role };

      return RESPONSE(
        HttpStatus.OK,
        {
          access_token: this.jwtService.sign(payload),
          id: user._id,
          email: user.email,
          role: user.role,
          fullName: user.fullName, // ✅ include fullName
          avatar: user.avatar, // ✅ include avatar
          isVerified: user.isVerified, // ✅ include verification status
        },
        'Login successful',
      );
    } catch (error: any) {
      return RESPONSE(HttpStatus.INTERNAL_SERVER_ERROR, error, 'Login failed');
    }
  }

  async sendOtp(email: string) {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      this.otpStore.set(normalizedEmail, {
        otp,
        expiresAt: Date.now() + 2 * 60 * 1000,
      });
      console.log('DEBUG SEND OTP', { normalizedEmail, otp });
      await this.mailerService.sendOtp(normalizedEmail, otp);
      return RESPONSE(HttpStatus.OK, {}, 'OTP sent to email');
    } catch (error: any) {
      return RESPONSE(
        HttpStatus.INTERNAL_SERVER_ERROR,
        error,
        'Failed to send OTP',
      );
    }
  }

  async verifyOtp(email: string, otp: string, userData: RegisterAuthDto) {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const record = this.otpStore.get(normalizedEmail);

      if (!record || record.expiresAt < Date.now() || record.otp !== otp) {
        return RESPONSE(HttpStatus.UNAUTHORIZED, {}, 'Invalid or expired OTP');
      }

      this.otpStore.delete(normalizedEmail);

      const existingUser = await this.usersService.findByEmail(normalizedEmail);
      if (existingUser) {
        return RESPONSE(HttpStatus.BAD_REQUEST, {}, 'Email already registered');
      }

      // ✅ Hash password here (one time only)
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const newUser = await this.usersService.createUser({
        fullName: userData.fullName,
        email: normalizedEmail,
        password: hashedPassword,
        role: 'user',
        isVerified: true,
      });

      return RESPONSE(
        HttpStatus.CREATED,
        {
          id: newUser._id,
          role: newUser.role,
          fullName: newUser.fullName,
          email: newUser.email,
          isVerified: newUser.isVerified,
        },
        'Account created successfully',
      );
    } catch (error: any) {
      console.log("MANGO ", error)
      return RESPONSE(
        HttpStatus.INTERNAL_SERVER_ERROR,
        error,
        'OTP verification failed',
      );
    }
  }

  async resendOtp(email: string) {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      this.otpStore.set(normalizedEmail, {
        otp,
        expiresAt: Date.now() + 2 * 60 * 1000,
      });

      console.log('DEBUG RESEND OTP NEW', { normalizedEmail, otp });
      await this.mailerService.sendOtp(normalizedEmail, otp);

      return RESPONSE(HttpStatus.OK, {}, 'New OTP sent to email');
    } catch (error: any) {
      return RESPONSE(
        HttpStatus.INTERNAL_SERVER_ERROR,
        error,
        'Failed to resend OTP',
      );
    }
  }

  async getProfile(userId: string) {
    try {
      const user = await this.usersService.findOneUserRaw(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const { password, ...safeUser } = user.toObject();

      return RESPONSE(
        HttpStatus.OK,
        {
          id: safeUser._id,
          fullName: safeUser.fullName,
          email: safeUser.email,
          role: safeUser.role,
          avatar: safeUser.avatar,
          isVerified: safeUser.isVerified,
        },
        'Profile fetched successfully',
      );
    } catch (error: any) {
      return RESPONSE(
        HttpStatus.INTERNAL_SERVER_ERROR,
        error,
        'Failed to fetch profile',
      );
    }
  }
}
