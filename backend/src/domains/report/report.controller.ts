import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { GenerateReportDto } from './report.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Reports')
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('sales')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate sales report' })
  async getSalesReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return ResponseBuilder.success(
      await this.reportService.generateSalesReport(startDate, endDate),
    );
  }

  @Get('products/category-breakdown')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get sales revenue/units broken down by product category' })
  async getProductCategoryBreakdown() {
    return ResponseBuilder.success(
      await this.reportService.getProductCategoryBreakdown(),
    );
  }

  @Get('inventory')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate inventory report' })
  async getInventoryReport() {
    return ResponseBuilder.success(
      await this.reportService.generateInventoryReport(),
    );
  }

  @Get('customers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate customer report' })
  async getCustomerReport() {
    return ResponseBuilder.success(
      await this.reportService.generateCustomerReport(),
    );
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate order report' })
  async getOrderReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return ResponseBuilder.success(
      await this.reportService.generateOrderReport(startDate, endDate),
    );
  }

  @Get('list/:type')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate list report by type' })
  async getListReport(
    @Param('type') type: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 50;
    return ResponseBuilder.success(
      await this.reportService.generateListReport(
        type.toUpperCase(),
        startDate,
        endDate,
        p,
        l,
      ),
    );
  }

  @Post('export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create export job' })
  async createExportJob(
    @Body() dto: GenerateReportDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.created(
      await this.reportService.createExportJob(dto, user.sub),
      'Export job created',
    );
  }

  @Get('exports')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List export jobs' })
  async getExportJobs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 10;
    return ResponseBuilder.success(
      await this.reportService.getExportJobs(p, l),
    );
  }

  @Get('exports/:id/download')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get export download URL' })
  async getExportDownloadUrl(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.reportService.getExportJobDownloadUrl(id),
    );
  }
}
