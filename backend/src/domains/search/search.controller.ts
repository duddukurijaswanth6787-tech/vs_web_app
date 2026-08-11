import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SearchService } from './search.service';
import {
  SearchProductsDto,
  AutocompleteDto,
  GlobalSearchDto,
} from './search.types';
import { CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({
    summary: 'Search products with filters, sorting, pagination',
  })
  async search(
    @Query() query: SearchProductsDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.searchService.search(query, user?.sub),
    );
  }

  @Get('autocomplete')
  @ApiOperation({ summary: 'Autocomplete search suggestions' })
  async autocomplete(@Query() dto: AutocompleteDto) {
    return ResponseBuilder.success(await this.searchService.autocomplete(dto));
  }

  @Get('global')
  @ApiOperation({
    summary:
      'Global search across products, orders, customers, categories, brands, coupons',
  })
  async globalSearch(@Query() dto: GlobalSearchDto) {
    return ResponseBuilder.success(await this.searchService.globalSearch(dto));
  }
}
