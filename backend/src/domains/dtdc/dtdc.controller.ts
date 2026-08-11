import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DtdcService } from './dtdc.service';
import { CreateDtdcShipmentDto, CancelDtdcShipmentDto } from './dtdc.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('DTDC Shipping')
@Controller('shipping/dtdc')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin', 'staff')
@ApiBearerAuth()
export class DtdcController {
  constructor(private readonly dtdcService: DtdcService) {}

  @Post('shipments')
  @ApiOperation({ summary: 'Create DTDC shipment for order' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateDtdcShipmentDto,
  ) {
    return ResponseBuilder.created(
      await this.dtdcService.createShipment(dto, user.sub),
      'Shipment created',
    );
  }

  @Get('shipments/order/:orderId')
  @ApiOperation({ summary: 'List DTDC shipments for order' })
  async byOrder(@Param('orderId') orderId: string) {
    return ResponseBuilder.success(await this.dtdcService.listByOrder(orderId));
  }

  @Get('shipments/:awbOrId/track')
  @ApiOperation({ summary: 'Track DTDC shipment' })
  async track(@Param('awbOrId') awbOrId: string) {
    return ResponseBuilder.success(await this.dtdcService.track(awbOrId));
  }

  @Get('shipments/:awbOrId/label')
  @ApiOperation({ summary: 'Get DTDC shipping label URL' })
  async label(@Param('awbOrId') awbOrId: string) {
    return ResponseBuilder.success(await this.dtdcService.getLabel(awbOrId));
  }

  @Post('shipments/:awbOrId/cancel')
  @ApiOperation({ summary: 'Cancel DTDC shipment' })
  async cancel(
    @Param('awbOrId') awbOrId: string,
    @Body() dto: CancelDtdcShipmentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.dtdcService.cancel(awbOrId, dto, user.sub),
      'Shipment cancelled',
    );
  }
}
