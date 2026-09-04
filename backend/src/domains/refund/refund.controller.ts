import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RefundService } from './refund.service';
import {
  CreateRefundDto,
  UpdateRefundDto,
  RefundQueryDto,
} from './refund.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import { PrismaService } from '@database/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Refunds')
@Controller('refunds')
export class RefundController {
  constructor(
    private readonly refundService: RefundService,
    private readonly prisma: PrismaService,
  ) {}

  private async isAdmin(userId: string): Promise<boolean> {
    const row = await this.prisma.userRole.findFirst({
      where: { userId, role: { name: { in: ['super_admin', 'admin'] } } },
      select: { userId: true },
    });
    return row !== null;
  }

  private async resolveCustomerId(userId: string): Promise<string | null> {
    const p = await this.prisma.customerProfile.findUnique({ where: { userId } });
    return p?.id ?? null;
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List refunds' })
  async findAll(@Query() query: RefundQueryDto) {
    return ResponseBuilder.success(await this.refundService.findAll(query));
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get refunds by order ID' })
  async findByOrderId(
    @Param('orderId') orderId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!await this.isAdmin(user.sub)) {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { customerId: true },
      });
      const customerId = await this.resolveCustomerId(user.sub);
      if (!order || order.customerId !== customerId)
        throw new ForbiddenException('Refund not found');
    }
    return ResponseBuilder.success(
      await this.refundService.findByOrderId(orderId),
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get refund by ID' })
  async findById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const refund = await this.refundService.findById(id);
    if (!await this.isAdmin(user.sub)) {
      const order = await this.prisma.order.findUnique({
        where: { id: (refund as any).orderId },
        select: { customerId: true },
      });
      const customerId = await this.resolveCustomerId(user.sub);
      if (!order || order.customerId !== customerId)
        throw new ForbiddenException('Refund not found');
    }
    return ResponseBuilder.success(refund);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create refund' })
  async create(@Body() dto: CreateRefundDto, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.refundService.create(user.sub, dto),
      'Refund created',
    );
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update refund status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRefundDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.refundService.updateStatus(id, dto, user.sub),
      'Refund status updated',
    );
  }
}
