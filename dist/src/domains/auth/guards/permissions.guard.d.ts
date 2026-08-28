import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from "../../../database/prisma.service";
export declare const PERMISSIONS_KEY = "permissions";
export declare const Permissions: (...permissions: string[]) => import("@nestjs/common").CustomDecorator<string>;
export declare class PermissionsGuard implements CanActivate {
    private readonly reflector;
    private readonly prisma;
    constructor(reflector: Reflector, prisma: PrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
