import { ConfigService } from '@nestjs/config';
import { PrismaService } from "../../database/prisma.service";
export interface SystemHealth {
    postgres: string;
    prisma: string;
    migration: string;
    redis: string;
    queue: string;
    storage: string;
    socket: string;
    scheduler: string;
}
export declare class StartupHealthService {
    private readonly configService;
    private readonly prismaService;
    constructor(configService: ConfigService, prismaService: PrismaService);
    getSystemHealth(): Promise<SystemHealth>;
}
