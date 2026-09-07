import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ShippingService } from './shipping.service';
import {
  CreateShippingMethodDto,
  CreateShippingZoneDto,
  CalculateShippingDto,
  BulkShippingLabelDto,
} from './shipping.types';

import { JwtAuthGuard, CurrentUser, Public } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ThrottleCredentials } from '@common/security/throttle.decorators';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

import { DelhiveryService } from './delhivery.service';

@ApiTags('Shipping')
@Controller('shipping')
export class ShippingController {
  constructor(
    private readonly shippingService: ShippingService,
    private readonly delhiveryService: DelhiveryService,
  ) {}

  @ThrottleCredentials()
  @Get('delhivery/pincode/:pincode')
  @Public()
  @ApiOperation({ summary: 'Check Delhivery pincode serviceability & COD availability' })
  async checkDelhiveryPincode(@Param('pincode') pincode: string) {
    return ResponseBuilder.success(
      await this.delhiveryService.checkPincode(pincode),
    );
  }

  @ThrottleCredentials()
  @Get('pincode/:pincode')
  @Public()
  @ApiOperation({ summary: 'Check pincode serviceability & COD availability' })
  async checkPincodeAlias(@Param('pincode') pincode: string) {
    return ResponseBuilder.success(
      await this.delhiveryService.checkPincode(pincode),
    );
  }

  @ThrottleCredentials()
  @Get('delhivery/track/:waybill')
  @Public()
  @ApiOperation({ summary: 'Track Delhivery shipment by AWB Waybill number' })
  async trackDelhiveryShipment(@Param('waybill') waybill: string) {
    return ResponseBuilder.success(
      await this.delhiveryService.trackShipment(waybill),
    );
  }

  @ThrottleCredentials()
  @Get('track/:waybill')
  @Public()
  @ApiOperation({ summary: 'Track shipment by AWB Waybill number' })
  async trackShipmentAlias(@Param('waybill') waybill: string) {
    return ResponseBuilder.success(
      await this.delhiveryService.trackShipment(waybill),
    );
  }

  @Get('delhivery/label/:waybill')
  @Public()
  @ApiOperation({ summary: 'Get direct Delhivery 4x6 thermal printable shipping label' })
  async getDelhiveryLabel(@Param('waybill') waybill: string) {
    return ResponseBuilder.success({
      waybill,
      labelUrl: `https://track.delhivery.com/api/v1/packages/label?waybill=${waybill}`,
      printFormat: '4x6 Thermal Barcode Label',
    });
  }

  @Get('delhivery/manifest')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate End-of-Day Courier Dispatch Manifest for Delhivery driver handover' })
  async getDelhiveryManifest(@Query('date') date?: string) {
    return ResponseBuilder.success(
      await this.delhiveryService.generateManifest(date),
    );
  }

  @Post('delhivery/pickup-request')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dispatch Delhivery courier pickup request' })
  async requestPickup(@Body() body: any) {
    return ResponseBuilder.success(
      await this.delhiveryService.requestPickup({
        pickupLocation: body.pickupLocation || 'VASANTHI_MAIN_WAREHOUSE',
        pickupDate: body.pickupDate || new Date().toISOString().split('T')[0],
        expectedPackageCount: body.expectedPackageCount || 1,
      }),
      'Pickup request dispatched successfully',
    );
  }

  @Get('methods')
  @ApiOperation({ summary: 'List all shipping methods' })
  async getMethods() {
    return ResponseBuilder.success(await this.shippingService.getMethods());
  }

  @Get('methods/:code/calculate')
  @ApiOperation({ summary: 'Calculate shipping rate for a method' })
  async calculateShipping(
    @Param('code') code: string,
    @Query() query: CalculateShippingDto,
  ) {
    return ResponseBuilder.success(
      await this.shippingService.calculateShipping({
        ...query,
        methodCode: code,
      }),
    );
  }

  @Post('methods')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a shipping method' })
  async createMethod(
    @Body() dto: CreateShippingMethodDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.created(
      await this.shippingService.createMethod(dto, user.sub),
      'Shipping method created',
    );
  }

  @Get('zones')
  @ApiOperation({ summary: 'List shipping zones for a method' })
  async getZones(@Query('methodId') methodId: string) {
    return ResponseBuilder.success(
      await this.shippingService.getZones(methodId),
    );
  }

  @Post('zones')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a shipping zone' })
  async createZone(
    @Body() dto: CreateShippingZoneDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.created(
      await this.shippingService.createZone(dto, user.sub),
      'Shipping zone created',
    );
  }

  @Post('bulk-labels')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk generate thermal 4x6 / A4 printable shipping barcode labels' })
  async generateBulkShippingLabels(@Body() dto: BulkShippingLabelDto) {
    return ResponseBuilder.success(
      await this.shippingService.generateBulkShippingLabels(dto),
      'Shipping labels generated successfully',
    );
  }
}

