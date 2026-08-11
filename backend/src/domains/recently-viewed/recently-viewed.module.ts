import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { RecentlyViewedController } from './recently-viewed.controller';
import { RecentlyViewedService } from './recently-viewed.service';

@Module({
  imports: [AuthModule],
  controllers: [RecentlyViewedController],
  providers: [RecentlyViewedService],
  exports: [RecentlyViewedService],
})
export class RecentlyViewedModule {}
