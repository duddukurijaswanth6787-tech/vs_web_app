import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StorefrontService } from './storefront.service';
import {
  UpdateWebsiteSettingDto,
  UpdateHomepageSectionDto,
  CreateHomepageCategoryDto,
  ReorderDto,
  UpdateSocialLinkDto,
  CreateFooterLinkDto,
  UpdateFooterLinkDto,
  UpdateFeatureToggleDto,
  BulkFeatureToggleDto,
  NewsletterQueryDto,
} from './storefront.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Storefront Management')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin')
@ApiBearerAuth()
@Controller('admin/storefront')
export class StorefrontController {
  constructor(private readonly storefrontService: StorefrontService) {}

  @Get('settings')
  @ApiOperation({ summary: 'Get website settings' })
  async getSettings() {
    return ResponseBuilder.success(await this.storefrontService.getSettings());
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update website settings' })
  async updateSettings(
    @Body() dto: UpdateWebsiteSettingDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.storefrontService.updateSettings(dto, user.sub),
      'Settings updated',
    );
  }

  @Get('homepage')
  @ApiOperation({ summary: 'Get homepage sections' })
  async getHomepage() {
    return ResponseBuilder.success(await this.storefrontService.getHomepage());
  }

  @Patch('homepage')
  @ApiOperation({ summary: 'Bulk update homepage sections' })
  async updateHomepage(
    @Body()
    body: { sections: { key: string; data: UpdateHomepageSectionDto }[] },
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.storefrontService.updateHomepage(body.sections, user.sub),
      'Homepage sections updated',
    );
  }

  @Patch('homepage/order')
  @ApiOperation({ summary: 'Reorder homepage sections' })
  async reorderHomepage(@Body() dto: ReorderDto) {
    return ResponseBuilder.success(
      await this.storefrontService.reorderHomepage(dto),
      'Homepage sections reordered',
    );
  }

  @Get('homepage/categories')
  @ApiOperation({ summary: 'Get homepage categories' })
  async getHomepageCategories() {
    return ResponseBuilder.success(
      await this.storefrontService.getHomepageCategories(),
    );
  }

  @Post('homepage/categories')
  @ApiOperation({ summary: 'Add category to homepage' })
  async addHomepageCategory(@Body() dto: CreateHomepageCategoryDto) {
    return ResponseBuilder.created(
      await this.storefrontService.addHomepageCategory(dto),
      'Category added to homepage',
    );
  }

  @Delete('homepage/categories/:id')
  @ApiOperation({ summary: 'Remove category from homepage' })
  async removeHomepageCategory(@Param('id') id: string) {
    await this.storefrontService.removeHomepageCategory(id);
    return ResponseBuilder.deleted('Category removed from homepage');
  }

  @Patch('homepage/categories/order')
  @ApiOperation({ summary: 'Reorder homepage categories' })
  async reorderHomepageCategories(@Body() dto: ReorderDto) {
    return ResponseBuilder.success(
      await this.storefrontService.reorderHomepageCategories(dto),
      'Homepage categories reordered',
    );
  }

  @Get('features')
  @ApiOperation({ summary: 'Get feature toggles' })
  async getFeatures() {
    return ResponseBuilder.success(await this.storefrontService.getFeatures());
  }

  @Patch('features/:key')
  @ApiOperation({ summary: 'Update a single feature toggle' })
  async updateFeature(
    @Param('key') key: string,
    @Body() dto: UpdateFeatureToggleDto,
  ) {
    return ResponseBuilder.success(
      await this.storefrontService.updateFeature(key, dto),
      'Feature toggle updated',
    );
  }

  @Patch('features')
  @ApiOperation({ summary: 'Bulk update feature toggles' })
  async bulkUpdateFeatures(
    @Body() dto: BulkFeatureToggleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.storefrontService.bulkUpdateFeatures(dto, user.sub),
      'Feature toggles updated',
    );
  }

  @Get('footer')
  @ApiOperation({ summary: 'Get footer with sections and links' })
  async getFooter() {
    return ResponseBuilder.success(
      await this.storefrontService.getFooterAdmin(),
    );
  }

  @Post('footer/link')
  @ApiOperation({ summary: 'Add a footer link' })
  async addFooterLink(@Body() dto: CreateFooterLinkDto) {
    return ResponseBuilder.created(
      await this.storefrontService.addFooterLink(dto),
      'Footer link added',
    );
  }

  @Patch('footer/link/:id')
  @ApiOperation({ summary: 'Update a footer link' })
  async updateFooterLink(
    @Param('id') id: string,
    @Body() dto: UpdateFooterLinkDto,
  ) {
    return ResponseBuilder.success(
      await this.storefrontService.updateFooterLink(id, dto),
      'Footer link updated',
    );
  }

  @Delete('footer/link/:id')
  @ApiOperation({ summary: 'Delete a footer link' })
  async deleteFooterLink(@Param('id') id: string) {
    await this.storefrontService.deleteFooterLink(id);
    return ResponseBuilder.deleted('Footer link deleted');
  }

  @Get('social')
  @ApiOperation({ summary: 'Get social links' })
  async getSocialLinks() {
    return ResponseBuilder.success(
      await this.storefrontService.getSocialLinks(),
    );
  }

  @Patch('social/:platform')
  @ApiOperation({ summary: 'Update a social link' })
  async updateSocialLink(
    @Param('platform') platform: string,
    @Body() dto: UpdateSocialLinkDto,
  ) {
    return ResponseBuilder.success(
      await this.storefrontService.updateSocialLink(platform, dto),
      'Social link updated',
    );
  }

  @Get('newsletter')
  @ApiOperation({ summary: 'Get newsletter subscribers' })
  async getNewsletters(@Query() query: NewsletterQueryDto) {
    return ResponseBuilder.success(
      await this.storefrontService.getNewsletters(query),
    );
  }

  @Get('newsletter/export')
  @ApiOperation({ summary: 'Export newsletter emails' })
  async exportNewsletters() {
    return ResponseBuilder.success(
      await this.storefrontService.exportNewsletters(),
    );
  }

  @Delete('newsletter/:id')
  @ApiOperation({ summary: 'Delete a newsletter subscriber' })
  async removeNewsletter(@Param('id') id: string) {
    await this.storefrontService.removeNewsletter(id);
    return ResponseBuilder.deleted('Newsletter subscriber deleted');
  }
}
