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
import { BusinessException } from '@common/exceptions';
import { ReturnRequestService } from './return-request.service';
import { ReturnQueryDto } from './return-request.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { AuditService } from '@domains/audit/audit.service';
import { NotificationService } from '@domains/notification/notification.service';
import { PrismaService } from '@database/prisma.service';
import { ResponseBuilder } from '@common/responses/response.builder';
import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

class CustomerReturnItemDto {
  @ApiProperty() @IsUUID() orderItemId!: string;
  @ApiProperty() @Type(() => Number) @IsInt() @Min(1) quantity!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}

class CustomerCreateReturnDto {
  @ApiProperty() @IsUUID() orderId!: string;
  @ApiProperty() @IsString() reason!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() refundPreference?: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
  @ApiProperty({ type: [CustomerReturnItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerReturnItemDto)
  items!: CustomerReturnItemDto[];
}

@ApiTags('Returns')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MeReturnsController {
  constructor(
    private readonly returnRequestService: ReturnRequestService,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  private async resolveCustomerId(userId: string): Promise<string | null> {
    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });
    return profile?.id ?? null;
  }

  @Post('returns')
  @ApiOperation({ summary: 'Create a return request' })
  async create(
    @Body() dto: CustomerCreateReturnDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const isAdmin = user.roles?.some((r) =>
      ['super_admin', 'admin'].includes(r),
    );
    if (!isAdmin) {
      const order = await this.prisma.order.findUnique({
        where: { id: dto.orderId },
        select: { customerId: true },
      });
      if (!order) throw new BusinessException('Order not found', 'ORDER_001');
      const customerId = await this.resolveCustomerId(user.sub);
      if (!customerId || order.customerId !== customerId)
        throw new BusinessException('Not authorized', 'RETURN_003');
      const existing = await this.prisma.returnRequest.findFirst({
        where: { orderId: dto.orderId, status: { notIn: ['CANCELLED'] } },
      });
      if (existing)
        throw new BusinessException(
          'Return already requested for this order',
          'RETURN_004',
        );
    }
    const reason = dto.description
      ? `${dto.reason}: ${dto.description}`
      : dto.reason;
    const result = await this.returnRequestService.create(user.sub, {
      orderId: dto.orderId,
      reason,
      items: dto.items,
      refundPreference: dto.refundPreference,
      images: dto.images,
    } as any);
    return ResponseBuilder.created(result, 'Return request created');
  }

  @Get('me/returns')
  @ApiOperation({ summary: 'Get current customer returns' })
  async findAll(
    @Query() query: ReturnQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const skip = (page - 1) * limit;
    const customerId = await this.resolveCustomerId(user.sub);
    if (!customerId) {
      return ResponseBuilder.success({
        data: [],
        meta: {
          page,
          limit,
          total: 0,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
      });
    }
    const where = { order: { customerId } } as any;
    if (query.status) where.status = query.status;
    const [data, total] = await Promise.all([
      this.prisma.returnRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { items: true, order: { select: { orderNumber: true } } },
      }),
      this.prisma.returnRequest.count({ where }),
    ]);
    return ResponseBuilder.success({
      data: data.map((r) => ({
        id: r.id,
        returnNumber: r.returnNumber,
        orderNumber: r.order.orderNumber,
        status: r.status,
        reason: r.reason,
        items: r.items.map((i: any) => ({
          id: i.id,
          orderItemId: i.orderItemId,
          quantity: i.quantity,
          reason: i.reason,
        })),
        createdAt: r.createdAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1,
      },
    });
  }

  @Get('me/returns/:returnId')
  @ApiOperation({ summary: 'Get return request details' })
  async findById(
    @Param('returnId') returnId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const ret = await this.prisma.returnRequest.findUnique({
      where: { id: returnId },
      include: {
        items: { include: { images: { orderBy: { displayOrder: 'asc' } } } },
        order: {
          include: {
            timeline: { orderBy: { createdAt: 'asc' } },
            addresses: true,
          },
        },
      },
    });
    if (!ret) return ResponseBuilder.success(null, 'Return not found');
    const customerId = await this.resolveCustomerId(user.sub);
    if (!customerId || ret.order.customerId !== customerId)
      return ResponseBuilder.success(null, 'Return not found');
    return ResponseBuilder.success({
      id: ret.id,
      returnNumber: ret.returnNumber,
      status: ret.status,
      reason: ret.reason,
      refundPreference: ret.refundPreference ?? undefined,
      adminNotes: ret.adminNotes ?? undefined,
      items: ret.items.map((i: any) => ({
        id: i.id,
        orderItemId: i.orderItemId,
        quantity: i.quantity,
        reason: i.reason,
        images: i.images?.map((img: any) => ({
          url: img.url,
          displayOrder: img.displayOrder,
        })),
      })),
      order: {
        orderNumber: ret.order.orderNumber,
        status: ret.order.status,
        timeline: ret.order.timeline.map((t: any) => ({
          status: t.status,
          time: t.createdAt.toISOString(),
        })),
      },
      createdAt: ret.createdAt,
    });
  }

  @Patch('me/returns/:returnId/cancel')
  @ApiOperation({ summary: 'Cancel a return request' })
  async cancel(
    @Param('returnId') returnId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const ret = await this.prisma.returnRequest.findUnique({
      where: { id: returnId },
      include: {
        order: { select: { customerId: true, id: true, orderNumber: true } },
      },
    });
    if (!ret) return ResponseBuilder.success(null, 'Return not found');
    const customerId = await this.resolveCustomerId(user.sub);
    if (!customerId || ret.order.customerId !== customerId)
      return ResponseBuilder.success(null, 'Return not found');
    if (!['REQUESTED', 'APPROVED'].includes(ret.status))
      throw new BusinessException(
        'Cannot cancel return in current status',
        'RETURN_005',
      );
    await this.prisma.returnRequest.update({
      where: { id: returnId },
      data: { status: 'CANCELLED', updatedBy: user.sub },
    });
    await this.prisma.orderTimeline.create({
      data: {
        orderId: ret.order.id,
        status: 'RETURN_CANCELLED',
        message: `Return ${ret.returnNumber} cancelled by customer`,
        createdBy: user.sub,
      },
    });
    await this.auditService.log({
      action: 'RETURN_CANCELLED',
      module: 'returns',
      resource: 'return_request',
      resourceId: returnId,
      userId: user.sub,
      oldValue: { status: ret.status },
      newValue: { status: 'CANCELLED' },
    });
    await this.notificationService.create({
      userId: user.sub,
      type: 'ORDER_RETURNED',
      title: 'Return Cancelled',
      message: `Return ${ret.returnNumber} has been cancelled`,
      data: { returnId, returnNumber: ret.returnNumber },
    });
    return ResponseBuilder.success(
      { id: ret.id, status: 'CANCELLED' },
      'Return cancelled',
    );
  }
}
