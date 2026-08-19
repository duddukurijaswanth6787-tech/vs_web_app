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
import { CategoriesService } from './categories.service';
import { ProductsService } from '@domains/products/products.service';
import { ProductQueryDto } from '@domains/products/products.types';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  MoveCategoryDto,
  ReorderCategoriesDto,
  CategoryQueryDto,
} from './categories.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { PermissionsGuard, Permissions } from '@domains/auth/guards/permissions.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly productsService: ProductsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List categories with search, pagination, filtering, sorting',
  })
  async findAll(@Query() query: CategoryQueryDto) {
    return ResponseBuilder.success(await this.categoriesService.findAll(query));
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get full category tree (unlimited nesting)' })
  async getTree() {
    return ResponseBuilder.success(await this.categoriesService.getTree());
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured categories for the homepage' })
  async findFeatured() {
    return ResponseBuilder.success(await this.categoriesService.findFeatured());
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get category by slug' })
  async findBySlug(@Param('slug') slug: string) {
    return ResponseBuilder.success(
      await this.categoriesService.findBySlug(slug),
    );
  }

  @Get('slug/:slug/products')
  @ApiOperation({ summary: 'Get products by category slug' })
  async findProductsBySlug(
    @Param('slug') slug: string,
    @Query() query: ProductQueryDto,
  ) {
    const cat = await this.categoriesService.findBySlug(slug);
    return ResponseBuilder.success(
      await this.productsService.findAll({ ...query, categoryId: cat.id }),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  async findById(@Param('id') id: string) {
    return ResponseBuilder.success(await this.categoriesService.findById(id));
  }

  @Get(':id/children')
  @ApiOperation({ summary: 'Get direct children of a category' })
  async findChildren(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.categoriesService.findChildren(id),
    );
  }

  @Get(':id/ancestors')
  @ApiOperation({ summary: 'Get ancestor chain from root to parent' })
  async findAncestors(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.categoriesService.findAncestors(id),
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('categories:create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new category' })
  async create(
    @Body() dto: CreateCategoryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.created(
      await this.categoriesService.create(dto, user.sub),
      'Category created',
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('categories:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a category' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.categoriesService.update(id, dto, user.sub),
      'Category updated',
    );
  }

  @Patch(':id/move')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('categories:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Move category to a new parent' })
  async move(
    @Param('id') id: string,
    @Body() dto: MoveCategoryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.categoriesService.move(id, dto, user.sub),
      'Category moved',
    );
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('categories:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Batch reorder categories' })
  async reorder(
    @Body() dto: ReorderCategoriesDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.categoriesService.reorder(dto, user.sub);
    return ResponseBuilder.success(null, 'Categories reordered');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('categories:delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a category (must have no children)' })
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.categoriesService.delete(id, user.sub);
    return ResponseBuilder.deleted('Category deleted');
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('categories:delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore a soft-deleted category' })
  async restore(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.categoriesService.restore(id, user.sub),
      'Category restored',
    );
  }
}
