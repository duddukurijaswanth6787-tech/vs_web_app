import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { InvoiceModule } from '@domains/invoice/invoice.module';
import { CancellationModule } from '@domains/cancellation/cancellation.module';
import { OrderController } from './order.controller';
import { MeOrdersController } from './me-orders.controller';
import { OrderService } from './order.service';
import { OrderRepository } from './order.repository';
import { OrderWorkflowService } from './order-workflow.service';

@Module({
  imports: [
    AuthModule,
    AuditModule,
    InvoiceModule,
    forwardRef(() => CancellationModule),
  ],
  controllers: [OrderController, MeOrdersController],
  providers: [OrderService, OrderRepository, OrderWorkflowService],
  exports: [OrderWorkflowService],
})
export class OrderModule {}
