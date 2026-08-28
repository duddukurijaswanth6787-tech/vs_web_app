import { PrismaService } from './prisma.service';
export declare class TransactionManager {
    private readonly prisma;
    constructor(prisma: PrismaService);
    execute<T>(fn: (tx: PrismaService) => Promise<T>, options?: {
        timeout?: number;
        maxRetries?: number;
    }): Promise<T>;
    private isRetryable;
}
