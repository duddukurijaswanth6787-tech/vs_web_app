import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StorefrontPublicService } from './storefront-public.service';
import { ThemeService } from './theme.service';
import { ProductsService } from '@domains/products/products.service';
import { NewsletterSubscribeDto } from './storefront.types';
import { ResponseBuilder } from '@common/responses/response.builder';
import { Public } from '@domains/auth/guards/jwt-auth.guard';

@ApiTags('Storefront Public')
@Controller()
export class StorefrontPublicController {
  constructor(
    private readonly storefrontPublicService: StorefrontPublicService,
    private readonly productsService: ProductsService,
    private readonly themeService: ThemeService,
  ) {}

  @Get('storefront/theme')
  @Public()
  @ApiOperation({ summary: 'Per-section storefront colours' })
  async getTheme() {
    return ResponseBuilder.success(await this.themeService.getTheme());
  }

  @Get(['settings/public', 'public/settings'])
  @Public()
  @ApiOperation({ summary: 'Get public store settings' })
  async getPublicSettings() {
    return ResponseBuilder.success(
      await this.storefrontPublicService.getPublicSettings(),
    );
  }

  @Get('homepage')
  @ApiOperation({ summary: 'Get homepage configuration' })
  async getHomepage() {
    return ResponseBuilder.success(
      await this.storefrontPublicService.getHomepage(),
    );
  }

  @Get('footer')
  @ApiOperation({ summary: 'Get footer sections and links' })
  async getFooter() {
    return ResponseBuilder.success(
      await this.storefrontPublicService.getFooter(),
    );
  }

  @Get('social')
  @ApiOperation({ summary: 'Get social links' })
  async getSocialLinks() {
    return ResponseBuilder.success(
      await this.storefrontPublicService.getSocialLinks(),
    );
  }

  @Get('features')
  @ApiOperation({ summary: 'Get feature toggles' })
  async getFeatures() {
    return ResponseBuilder.success(
      await this.storefrontPublicService.getFeatures(),
    );
  }

  @Post('newsletter/subscribe')
  @ApiOperation({ summary: 'Subscribe to newsletter' })
  async subscribe(@Body() dto: NewsletterSubscribeDto) {
    return ResponseBuilder.created(
      await this.storefrontPublicService.subscribeToNewsletter(dto),
      'Successfully subscribed to newsletter',
    );
  }

  @Get('products/slug/:slug')
  @ApiOperation({ summary: 'Get product by slug' })
  async getProductBySlug(@Param('slug') slug: string) {
    // ponytail: reuses existing ProductsService to avoid logic duplication
    const product = await this.productsService.findBySlug(slug, true);
    if (!product) throw new NotFoundException('Product not found');
    return ResponseBuilder.success(product);
  }
}
