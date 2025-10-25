import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string; // user id (_id from Mongo)
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_KEY ||
        '38842a6deb1c95127e2f2403f2a58d710c1901e4fa3a33493dfa25bd9f92259f00f04c21d13ad53d0b5c63f51d8ed0830d8906cf7f3a33597b16c140a3f4f51f',
    });
  }

  async validate(payload: JwtPayload) {
    // Align naming with your DB: return `id` instead of `userId`
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
