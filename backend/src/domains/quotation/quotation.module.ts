import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { PosModule } from '@domains/pos/pos.module';
import { QuotationController } from './quotation.controller';
import { QuotationService } from './quotation.service';

/**
 * Imports PosModule so conversion runs through the till's own completeSale --
 * the path that already enforces the open-shift rule and moves stock
 * atomically -- rather than a second implementation of the same thing.
 */
@Module({
  imports: [DatabaseModule, PosModule],
  controllers: [QuotationController],
  providers: [QuotationService],
  exports: [QuotationService],
})
export class QuotationModule {}
