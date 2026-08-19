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
import { BrandsService } from './brands.service';
import { ProductsService } from '@domains/products/products.service';
import { ProductQueryDto } from '@domains/products/products.types';
import { CreateBrandDto, UpdateBrandDto, BrandQueryDto } from './brands.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { PermissionsGuard, Permissions } from '@domains/auth/guards/permissions.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Brands')
@Controller('brands')
export class BrandsController {
  constructor(
    private readonly brandsService: BrandsService,
    private readonly productsService: ProductsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List brands with search, pagination, filtering, sorting',
  })
  async findAll(@Query() query: BrandQueryDto) {
    return ResponseBuilder.success(await this.brandsService.findAll(query));
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured brands' })
  async findFeatured() {
    return ResponseBuilder.success(await this.brandsService.findFeatured());
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get brand by slug' })
  async findBySlug(@Param('slug') slug: string) {
    return ResponseBuilder.success(await this.brandsService.findBySlug(slug));
  }

  @Get('slug/:slug/products')
  @ApiOperation({ summary: 'Get products by brand slug' })
  async findProductsBySlug(
    @Param('slug') slug: string,
    @Query() query: ProductQueryDto,
  ) {
    const brand = await this.brandsService.findBySlug(slug);
    return ResponseBuilder.success(
      await this.productsService.findAll({ ...query, brandId: brand.id }),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get brand by ID' })
  async findById(@Param('id') id: string) {
    return ResponseBuilder.success(await this.brandsService.findById(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('brands:create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new brand' })
  async create(@Body() dto: CreateBrandDto, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.created(
      await this.brandsService.create(dto, user.sub),
      'Brand created',
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('brands:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a brand' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBrandDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.brandsService.update(id, dto, user.sub),
      'Brand updated',
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a brand' })
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.brandsService.delete(id, user.sub);
    return ResponseBuilder.deleted('Brand deleted');
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore a soft-deleted brand' })
  async restore(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.brandsService.restore(id, user.sub),
      'Brand restored',
    );
  }
}
