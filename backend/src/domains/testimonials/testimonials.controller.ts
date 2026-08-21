import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TestimonialsService } from './testimonials.service';
import { CreateTestimonialDto, UpdateTestimonialDto } from './testimonials.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { PermissionsGuard, Permissions } from '@domains/auth/guards/permissions.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Testimonials')
@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Get('featured')
  @ApiOperation({ summary: 'Get active featured customer testimonials for homepage' })
  async findFeatured() {
    return ResponseBuilder.success(await this.testimonialsService.findFeatured());
  }

  @Get()
  @ApiOperation({ summary: 'Get all testimonials (Admin / Storefront)' })
  async findAll() {
    return ResponseBuilder.success(await this.testimonialsService.findAll());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get testimonial by ID' })
  async findById(@Param('id') id: string) {
    return ResponseBuilder.success(await this.testimonialsService.findById(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cms:manage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new testimonial' })
  async create(
    @Body() dto: CreateTestimonialDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.created(
      await this.testimonialsService.create(dto, user.sub),
      'Testimonial created successfully',
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cms:manage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a testimonial' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTestimonialDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.testimonialsService.update(id, dto, user.sub),
      'Testimonial updated successfully',
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cms:manage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a testimonial' })
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.testimonialsService.delete(id, user.sub);
    return ResponseBuilder.deleted('Testimonial deleted successfully');
  }
}
