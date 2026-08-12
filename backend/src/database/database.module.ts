import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TransactionManager } from './transaction.manager';
import { AutoSeedService } from './auto-seed.service';

/**
 * Global database module containing the database client, transaction manager,
 * and related utilities for data access infrastructure.
 */
@Global()
@Module({
  providers: [PrismaService, TransactionManager, AutoSeedService],
  exports: [PrismaService, TransactionManager, AutoSeedService],
})
export class DatabaseModule {}
