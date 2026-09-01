import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  createParamDecorator,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService, JwtPayload } from '../services/jwt.service';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class JwtAuthGuard {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    const token =
      (authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null) ||
      (request.query?.token as string) ||
      (request.query?.accessToken as string) ||
      (request.query?.access_token as string);

    if (token) {
      try {
        request.user = this.jwtService.verify(token);
        return true;
      } catch {
        if (isPublic) return true;
        throw new UnauthorizedException('Invalid or expired token');
      }
    }

    if (isPublic) return true;

    throw new UnauthorizedException(
      'Missing or invalid authorization header',
    );
  }
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    if (!request.user)
      throw new UnauthorizedException('User not authenticated');
    return request.user;
  },
);
