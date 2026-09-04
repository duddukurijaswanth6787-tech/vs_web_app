import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { OrderQueryDto, AssignCourierDto } from './order.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { PermissionsGuard, Permissions } from '@domains/auth/guards/permissions.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import { PrismaService } from '@database/prisma.service';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Orders')
@Controller('orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly prisma: PrismaService,
  ) {}

  private async isAdmin(userId: string): Promise<boolean> {
    const row = await this.prisma.userRole.findFirst({
      where: { userId, role: { name: { in: ['super_admin', 'admin'] } } },
      select: { userId: true },
    });
    return row !== null;
  }

  // Order.customerId is a CustomerProfile id, not the User id in the JWT's
  // `sub` -- must resolve one to the other before comparing ownership.
  private async resolveCustomerId(userId: string): Promise<string | null> {
    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });
    return profile?.id ?? null;
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List orders with filtering and pagination' })
  async findAll(
    @Query() query: OrderQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const isAdmin = await this.isAdmin(user.sub);
    const q = isAdmin ? query : { ...query, customerId: user.sub };
    return ResponseBuilder.success(await this.orderService.findAll(q, isAdmin));
  }

  @Get('number/:orderNumber')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order by order number' })
  async findByOrderNumber(
    @Param('orderNumber') orderNumber: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const isAdmin = await this.isAdmin(user.sub);
    const order = await this.orderService.findByOrderNumber(orderNumber);
    if (!isAdmin && order.customerId !== (await this.resolveCustomerId(user.sub))) {
      return ResponseBuilder.success(null, 'Order not found');
    }
    return ResponseBuilder.success(order);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order by ID' })
  async findById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const isAdmin = await this.isAdmin(user.sub);
    const order = await this.orderService.findById(id, isAdmin);
    if (!isAdmin && order.customerId !== (await this.resolveCustomerId(user.sub))) {
      return ResponseBuilder.success(null, 'Order not found');
    }
    return ResponseBuilder.success(order);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('orders:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; message?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.orderService.updateStatus(
        id,
        body.status,
        user.sub,
        body.message,
      ),
      'Order status updated',
    );
  }

  @Patch(':id/courier')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('orders:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign courier partner & waybill to order' })
  async assignCourier(
    @Param('id') id: string,
    @Body() dto: AssignCourierDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.orderService.assignCourier(id, dto, user.sub),
      'Courier partner assigned & shipment updated',
    );
  }
}
