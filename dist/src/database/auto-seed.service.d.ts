import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service';
export declare class AutoSeedService implements OnModuleInit {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    seedEssentialData(): Promise<void>;
}
