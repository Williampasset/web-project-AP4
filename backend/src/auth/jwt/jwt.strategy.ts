import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secret_key',
    });
  }

  /**
   * Validate the JWT payload and return the user data.
   * @param payload Decoded JWT payload
   * @returns User data injected into req.user
   */
  async validate(payload: { sub: number; matricule: string; role: string }) {
    return {
      id: payload.sub,
      matricule: payload.matricule,
      role: payload.role,
    };
  }
}
