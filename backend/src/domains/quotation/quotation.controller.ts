import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import type { JwtPayload } from '@domains/auth/services/jwt.service';
import {
  PermissionsGuard,
  Permissions,
} from '@domains/auth/guards/permissions.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import { QuotationService } from './quotation.service';
import {
  ConvertQuotationDto,
  CreateQuotationDto,
  UpdateQuotationDto,
} from './quotation.types';

/**
 * Quotes carry prices the shop is committing to, so every route is behind a
 * permission -- and converting one takes money and stock, which is why it is
 * gated separately from merely reading or drafting.
 */
@ApiTags('Quotations')
@ApiBearerAuth()
@Controller('quotations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class QuotationController {
  constructor(private readonly quotationService: QuotationService) {}

  @Get()
  @Permissions('quotations:view')
  @ApiOperation({ summary: 'List quotations' })
  async list(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return ResponseBuilder.success(
      await this.quotationService.list({
        status,
        search,
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      }),
    );
  }

  @Get(':id')
  @Permissions('quotations:view')
  @ApiOperation({ summary: 'Get one quotation' })
  async get(@Param('id') id: string) {
    return ResponseBuilder.success(await this.quotationService.get(id));
  }

  @Post()
  @Permissions('quotations:create')
  @ApiOperation({ summary: 'Create a quotation' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateQuotationDto,
  ) {
    return ResponseBuilder.success(
      await this.quotationService.create(user.sub, dto),
    );
  }

  @Patch(':id')
  @Permissions('quotations:update')
  @ApiOperation({ summary: 'Update a draft quotation' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateQuotationDto,
  ) {
    return ResponseBuilder.success(
      await this.quotationService.update(user.sub, id, dto),
    );
  }

  @Post(':id/cancel')
  @Permissions('quotations:update')
  @ApiOperation({ summary: 'Cancel a quotation' })
  async cancel(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return ResponseBuilder.success(
      await this.quotationService.cancel(user.sub, id),
    );
  }

  @Post(':id/convert')
  // Separate from quotations:update on purpose: this one takes payment and
  // moves stock, so drafting a quote and selling it are different rights.
  @Permissions('quotations:convert')
  @ApiOperation({ summary: 'Convert an accepted quotation into a POS sale' })
  async convert(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ConvertQuotationDto,
  ) {
    return ResponseBuilder.success(
      await this.quotationService.convert(user.sub, id, dto),
    );
  }
}
