import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SizeChartService } from './size-chart.service';
import {
  CreateSizeChartTemplateDto,
  UpdateSizeChartTemplateDto,
  SizeChartQueryDto,
} from './size-chart.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import type { JwtPayload } from '@domains/auth/services/jwt.service';
import { ResponseBuilder } from '@common/responses/response.builder';

@ApiTags('Size Charts')
@Controller('size-charts')
export class SizeChartController {
  constructor(private readonly sizeChartService: SizeChartService) {}

  @Get()
  @ApiOperation({ summary: 'List size chart templates (public)' })
  async findAll(@Query() query: SizeChartQueryDto) {
    return ResponseBuilder.success(await this.sizeChartService.findAll(query));
  }

  @Get('product/:productId')
  @ApiOperation({
    summary: 'Get the size chart attached to a product (public)',
  })
  async findByProduct(@Param('productId') productId: string) {
    return ResponseBuilder.success(
      await this.sizeChartService.findByProductId(productId),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a size chart template (public)' })
  async findById(@Param('id') id: string) {
    return ResponseBuilder.success(await this.sizeChartService.findById(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a size chart template' })
  async create(
    @Body() dto: CreateSizeChartTemplateDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.created(
      await this.sizeChartService.create(dto, user.sub),
      'Size chart created',
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a size chart template' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSizeChartTemplateDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.sizeChartService.update(id, dto, user.sub),
      'Size chart updated',
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a size chart template' })
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.sizeChartService.remove(id, user.sub);
    return ResponseBuilder.deleted('Size chart deleted');
  }
}
