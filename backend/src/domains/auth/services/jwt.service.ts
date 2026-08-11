import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: string;
  email: string;
  userType: string;
  roles: string[];
}

@Injectable()
export class JwtService {
  private readonly secret: string;
  private readonly expiresIn: number;
  private readonly rememberMeExpiresIn: number;
  private readonly issuer: string;

  constructor(private readonly configService: ConfigService) {
    this.secret = this.configService.get<string>(
      'app.jwt.secret',
      'dev-secret',
    );
    this.expiresIn = this.configService.get<number>('app.jwt.expiresIn', 900);
    this.rememberMeExpiresIn = this.configService.get<number>(
      'app.jwt.rememberMeExpiresIn',
      2592000,
    );
    this.issuer = this.configService.get<string>(
      'app.jwt.issuer',
      'vasanthi-designers',
    );
  }

  sign(payload: JwtPayload, rememberMe = false): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: rememberMe ? this.rememberMeExpiresIn : this.expiresIn,
      issuer: this.issuer,
    });
  }

  verify(token: string): JwtPayload {
    return jwt.verify(token, this.secret, {
      issuer: this.issuer,
    }) as JwtPayload;
  }

  getExpiresIn(rememberMe = false): number {
    return rememberMe ? this.rememberMeExpiresIn : this.expiresIn;
  }
}
