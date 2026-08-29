import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { JWT_SECRET } from '../auth.constants';
import type { AuthenticatedUser, UserRole } from '../types/authenticated-user';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }

  async validate(payload: {
    sub: number;
    username: string;
    role: UserRole;
  }): Promise<AuthenticatedUser> {
    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
    };
  }
}
