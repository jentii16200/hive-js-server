// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    MailerModule,
    CacheModule.register({
      ttl: 300, // seconds
      max: 100, // maximum number of items in cache
      isGlobal: true,
    }), // <-- idagdag ito
    JwtModule.register({
      secret:
        process.env.JWT_KEY ||
        '38842a6deb1c95127e2f2403f2a58d710c1901e4fa3a33493dfa25bd9f92259f00f04c21d13ad53d0b5c63f51d8ed0830d8906cf7f3a33597b16c140a3f4f51f',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}