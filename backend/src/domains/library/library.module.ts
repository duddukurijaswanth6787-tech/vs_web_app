import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { StorageModule } from '@infrastructure/storage/storage.module';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';
import { LibraryRepository } from './library.repository';

@Module({
  imports: [AuthModule, AuditModule, StorageModule],
  controllers: [LibraryController],
  providers: [LibraryService, LibraryRepository],
  exports: [LibraryService],
})
export class LibraryModule {}
