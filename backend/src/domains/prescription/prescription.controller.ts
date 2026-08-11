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
import { PrescriptionService } from './prescription.service';
import {
  UploadPrescriptionDto,
  UpdatePrescriptionDto,
  VerifyPrescriptionDto,
  PrescriptionQueryDto,
} from './prescription.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Prescriptions')
@Controller('prescriptions')
export class PrescriptionController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List own prescriptions' })
  async findAll(
    @Query() query: PrescriptionQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.prescriptionService.findAll(user.sub, query),
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get prescription by ID' })
  async findById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.prescriptionService.findById(id, user.sub),
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload prescription' })
  async upload(
    @Body() dto: UploadPrescriptionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.created(
      await this.prescriptionService.upload(user.sub, dto),
      'Prescription uploaded',
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update prescription' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePrescriptionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.prescriptionService.update(id, dto, user.sub),
      'Prescription updated',
    );
  }

  @Post(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify prescription (admin)' })
  async verify(
    @Param('id') id: string,
    @Body() dto: VerifyPrescriptionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.prescriptionService.verify(id, dto, user.sub),
      'Prescription verified',
    );
  }
}
