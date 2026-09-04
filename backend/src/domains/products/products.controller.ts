import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  AssignCategoriesDto,
  AssignAttributesDto,
  AssignTagsDto,
  AssignCollectionsDto,
  AssignRelatedProductsDto,
} from './products.types';
import { CreateColorGroupDto, SyncColorGroupsDto } from './dto/color-group.dto';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { PermissionsGuard, Permissions } from '@domains/auth/guards/permissions.guard';
import { AuthService } from '@domains/auth/auth.service';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

const INTERNAL_ROLES = ['super_admin', 'admin', 'staff'];

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly authService: AuthService,
  ) {}

  /**
   * This list/detail endpoint is intentionally unauthenticated (the public
   * storefront hits it directly), but STORE-only products must stay hidden
   * from anyone who isn't staff. Rather than trust a client-supplied "show
   * me everything" flag, this soft-checks whatever bearer token the caller
   * already sent (admin sessions always attach one) and only lifts the
   * restriction if it's valid and belongs to an internal role. A
   * missing/invalid/customer token just means "public" -- it never fails
   * the request.
   */
  private isInternalRequest(req: Request): boolean {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return false;
    try {
      const payload = this.authService.verifyToken(header.slice(7));
      return payload.roles?.some((r) => INTERNAL_ROLES.includes(r)) ?? false;
    } catch {
      return false;
    }
  }

  // ─── Public ────────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: 'List products with search, pagination, filtering, sorting',
  })
  async findAll(@Query() query: ProductQueryDto, @Req() req: Request) {
    const restrictToPublicChannels = !this.isInternalRequest(req);
    return ResponseBuilder.success(
      await this.productsService.findAll(query, restrictToPublicChannels),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  async findById(@Param('id') id: string, @Req() req: Request) {
    const restrictToPublicChannels = !this.isInternalRequest(req);
    return ResponseBuilder.success(
      await this.productsService.findById(id, restrictToPublicChannels),
    );
  }

  // ─── Admin: CRUD ───────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products:create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product' })
  async create(@Body() dto: CreateProductDto, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.created(
      await this.productsService.create(dto, user.sub),
      'Product created',
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.productsService.update(id, dto, user.sub),
      'Product updated',
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products:delete', 'products:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a product' })
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.productsService.delete(id, user.sub);
    return ResponseBuilder.deleted('Product deleted');
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products:delete', 'products:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore a soft-deleted product' })
  async restore(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.productsService.restore(id, user.sub),
      'Product restored',
    );
  }

  // ─── Admin: Publish ────────────────────────────────────

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a product' })
  async publish(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.productsService.publish(id, user.sub),
      'Product published',
    );
  }

  @Post(':id/unpublish')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unpublish a product' })
  async unpublish(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.productsService.unpublish(id, user.sub),
      'Product unpublished',
    );
  }

  // ─── Admin: Feature ────────────────────────────────────

  @Post(':id/feature')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Feature a product' })
  async feature(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.productsService.feature(id, user.sub),
      'Product featured',
    );
  }

  @Post(':id/unfeature')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unfeature a product' })
  async unfeature(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.productsService.unfeature(id, user.sub),
      'Product unfeatured',
    );
  }

  // ─── Admin: Categories ─────────────────────────────────

  @Post(':id/categories')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign categories to product' })
  async assignCategories(
    @Param('id') id: string,
    @Body() dto: AssignCategoriesDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.productsService.assignCategories(id, dto, user.sub),
      'Categories assigned',
    );
  }

  @Delete(':id/categories/:categoryId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove category from product' })
  async removeCategory(
    @Param('id') id: string,
    @Param('categoryId') categoryId: string,
  ) {
    return ResponseBuilder.success(
      await this.productsService.removeCategory(id, categoryId),
      'Category removed',
    );
  }

  // ─── Admin: Attributes ─────────────────────────────────

  @Post(':id/attributes')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign attributes to product' })
  async assignAttributes(
    @Param('id') id: string,
    @Body() dto: AssignAttributesDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.productsService.assignAttributes(id, dto, user.sub),
      'Attributes assigned',
    );
  }

  @Delete(':id/attributes/:attributeId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove attribute from product' })
  async removeAttribute(
    @Param('id') id: string,
    @Param('attributeId') attributeId: string,
  ) {
    return ResponseBuilder.success(
      await this.productsService.removeAttribute(id, attributeId),
      'Attribute removed',
    );
  }

  // ─── Admin: Tags ───────────────────────────────────────

  @Post(':id/tags')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign tags to product' })
  async assignTags(
    @Param('id') id: string,
    @Body() dto: AssignTagsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.productsService.assignTags(id, dto, user.sub),
      'Tags assigned',
    );
  }

  @Delete(':id/tags/:tag')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove tag from product' })
  async removeTag(
    @Param('id') id: string,
    @Param('tag') tag: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.productsService.removeTag(id, tag, user.sub),
      'Tag removed',
    );
  }

  // ─── Admin: Collections ────────────────────────────────

  @Post(':id/collections')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign collections to product' })
  async assignCollections(
    @Param('id') id: string,
    @Body() dto: AssignCollectionsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.productsService.assignCollections(id, dto, user.sub),
      'Collections assigned',
    );
  }

  @Delete(':id/collections/:collection')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove collection from product' })
  async removeCollection(
    @Param('id') id: string,
    @Param('collection') collection: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.productsService.removeCollection(id, collection, user.sub),
      'Collection removed',
    );
  }

  // ─── Admin: Related Products ───────────────────────────

  @Post(':id/related')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign related products' })
  async assignRelatedProducts(
    @Param('id') id: string,
    @Body() dto: AssignRelatedProductsDto,
  ) {
    return ResponseBuilder.success(
      await this.productsService.assignRelatedProducts(id, dto),
      'Related products assigned',
    );
  }

  @Delete(':id/related/:relatedProductId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove related product' })
  async removeRelatedProduct(
    @Param('id') id: string,
    @Param('relatedProductId') relatedProductId: string,
  ) {
    return ResponseBuilder.success(
      await this.productsService.removeRelatedProduct(id, relatedProductId),
      'Related product removed',
    );
  }

  // ─── Admin: Color Groups ───────────────────────────────

  @Post(':id/color-groups')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or update a product color group' })
  async createColorGroup(
    @Param('id') id: string,
    @Body() dto: CreateColorGroupDto,
  ) {
    return ResponseBuilder.created(
      await this.productsService.createColorGroup(id, dto),
      'Color group created',
    );
  }

  @Get(':id/color-groups')
  @ApiOperation({ summary: 'Get all color groups for a product' })
  async getColorGroups(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.productsService.getColorGroups(id),
    );
  }

  @Delete(':id/color-groups/:groupId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a color group' })
  async deleteColorGroup(
    @Param('id') id: string,
    @Param('groupId') groupId: string,
  ) {
    await this.productsService.deleteColorGroup(id, groupId);
    return ResponseBuilder.deleted('Color group deleted');
  }

  @Post(':id/color-groups/sync')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync color groups, variants, and media' })
  async syncColorGroups(
    @Param('id') id: string,
    @Body() dto: SyncColorGroupsDto,
  ) {
    return ResponseBuilder.success(
      await this.productsService.syncColorGroups(id, dto),
      'Color groups synchronized',
    );
  }
}
