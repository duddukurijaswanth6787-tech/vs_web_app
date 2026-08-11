import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PackingService } from './packing.service';
import {
  CreatePackingJobDto,
  VerifyBarcodeDto,
  PackingQueueQueryDto,
  AssignPackingDto,
} from './packing.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Packing')
@Controller('packing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin', 'staff')
@ApiBearerAuth()
export class PackingController {
  constructor(private readonly packingService: PackingService) {}

  @Get('queue')
  @ApiOperation({ summary: 'Get packing queue' })
  async queue(@Query() query: PackingQueueQueryDto) {
    return ResponseBuilder.success(await this.packingService.getQueue(query));
  }

  @Post('jobs')
  @ApiOperation({ summary: 'Create packing job for an order' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePackingJobDto,
  ) {
    return ResponseBuilder.created(
      await this.packingService.createJob(dto, user.sub),
      'Packing job created',
    );
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get packing job details' })
  async get(@Param('id') id: string) {
    return ResponseBuilder.success(await this.packingService.getById(id));
  }

  @Patch('jobs/:id/assign')
  @ApiOperation({ summary: 'Assign packing job' })
  async assign(
    @Param('id') id: string,
    @Body() dto: AssignPackingDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.packingService.assign(id, dto, user.sub),
    );
  }

  @Post('jobs/:id/start')
  @ApiOperation({ summary: 'Start packing' })
  async start(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.packingService.startPacking(id, user.sub),
    );
  }

  @Post('jobs/:id/verify-barcode')
  @ApiOperation({ summary: 'Verify packing barcode' })
  async verify(
    @Param('id') id: string,
    @Body() dto: VerifyBarcodeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.packingService.verifyBarcode(id, dto, user.sub),
      'Barcode verified',
    );
  }

  @Post('jobs/:id/label')
  @ApiOperation({ summary: 'Generate packing label' })
  async label(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.packingService.generateLabel(id, user.sub),
      'Label generated',
    );
  }

  @Post('jobs/:id/complete')
  @ApiOperation({ summary: 'Mark packing job completed' })
  async complete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.packingService.complete(id, user.sub),
      'Packing completed',
    );
  }
}
