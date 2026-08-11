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
import { ReturnRequestService } from './return-request.service';
import {
  CreateReturnDto,
  UpdateReturnStatusDto,
  ReturnQueryDto,
} from './return-request.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import { PrismaService } from '@database/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Returns')
@Controller('returns')
export class ReturnRequestController {
  constructor(
    private readonly returnService: ReturnRequestService,
    private readonly prisma: PrismaService,
  ) {}

  private isAdmin(user: JwtPayload): boolean {
    return !!user.roles?.some((r) => ['super_admin', 'admin'].includes(r));
  }

  private async resolveCustomerId(userId: string): Promise<string | null> {
    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });
    return profile?.id ?? null;
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List returns (admin: all, customer: own)' })
  async findAll(
    @Query() query: ReturnQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (this.isAdmin(user)) {
      return ResponseBuilder.success(await this.returnService.findAll(query));
    }
    query.orderId = undefined;
    const customerId = await this.resolveCustomerId(user.sub);
    if (!customerId) return ResponseBuilder.success({ data: [], meta: {} });
    return ResponseBuilder.success(
      await this.returnService.findAll(query, customerId),
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get return by ID' })
  async findById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const result = await this.returnService.findById(id);
    if (!this.isAdmin(user)) {
      const customerId = await this.resolveCustomerId(user.sub);
      const order = await this.prisma.order.findUnique({
        where: { id: result.orderId },
        select: { customerId: true },
      });
      if (!order || order.customerId !== customerId) {
        throw new ForbiddenException('Return request not found');
      }
    }
    return ResponseBuilder.success(result);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create return request' })
  async create(@Body() dto: CreateReturnDto, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.created(
      await this.returnService.create(user.sub, dto),
      'Return request created',
    );
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update return status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReturnStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.returnService.updateStatus(id, dto, user.sub),
      'Return status updated',
    );
  }
}
