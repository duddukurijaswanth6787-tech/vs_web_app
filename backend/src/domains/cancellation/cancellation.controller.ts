import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CancellationService } from './cancellation.service';
import {
  CreateCancellationDto,
  UpdateCancellationDto,
} from './cancellation.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Cancellations')
@Controller('cancellations')
export class CancellationController {
  constructor(private readonly cancelService: CancellationService) {}

  // Admin-only: customers create/view their own cancellations through
  // POST /me/orders/:orderNumber/cancel, which resolves and checks
  // ownership before ever calling into this service. These raw routes
  // key off orderId directly with no ownership check of their own, so
  // they must stay restricted to admins (the only real callers today).
  @Get(':orderId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get cancellation by order ID' })
  async findByOrderId(@Param('orderId') orderId: string) {
    return ResponseBuilder.success(
      await this.cancelService.findByOrderId(orderId),
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create cancellation request' })
  async create(
    @Body() dto: CreateCancellationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.created(
      await this.cancelService.create(user.sub, dto),
      'Cancellation request created',
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update cancellation' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCancellationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.cancelService.update(id, dto, user.sub),
      'Cancellation updated',
    );
  }
}
