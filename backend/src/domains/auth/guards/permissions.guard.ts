import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@database/prisma.service';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions || requiredPermissions.length === 0) return true;
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return false;

    // ponytail: single query to get permission codes for user's roles, no nested includes
    const userPermissions = await this.prisma.userRole.findMany({
      where: { userId: user.sub },
      select: {
        role: {
          select: {
            rolePermissions: {
              select: {
                permission: { select: { code: true } },
              },
            },
          },
        },
      },
    });

    const userPermissionSet = new Set(
      userPermissions.flatMap((ur) =>
        ur.role.rolePermissions.map((rp) => rp.permission.code),
      ),
    );
    return requiredPermissions.every((p) => userPermissionSet.has(p));
  }
}
