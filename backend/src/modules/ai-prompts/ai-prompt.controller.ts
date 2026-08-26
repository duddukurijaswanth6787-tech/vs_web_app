import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import type { JwtPayload } from '@domains/auth/services/jwt.service';
import { ResponseBuilder } from '@common/responses/response.builder';
import { AiPromptService } from './ai-prompt.service';
import { UpdatePromptTemplateDto } from './ai-prompt.types';

/**
 * Prompt templates shape copy that goes on the storefront, so they are
 * super_admin only -- the same bar as storefront colours, and stricter than
 * the rest of the catalog admin.
 */
@ApiTags('AI Content (Super Admin)')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
@ApiBearerAuth()
@Controller('admin/ai/prompts')
export class AiPromptController {
  constructor(private readonly service: AiPromptService) {}

  @Get()
  @ApiOperation({ summary: 'List prompt templates, variables and the accuracy rule' })
  async list() {
    return ResponseBuilder.success(await this.service.listWithMeta());
  }

  @Get(':type')
  @ApiOperation({ summary: 'Get one prompt template' })
  async get(@Param('type') type: string) {
    return ResponseBuilder.success(await this.service.get(type));
  }

  @Get(':type/history')
  @ApiOperation({ summary: 'Previous versions of a prompt template' })
  async history(@Param('type') type: string) {
    return ResponseBuilder.success(await this.service.history(type));
  }

  @Patch(':type')
  @ApiOperation({ summary: 'Update a prompt template (creates a new version)' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('type') type: string,
    @Body() dto: UpdatePromptTemplateDto,
  ) {
    return ResponseBuilder.success(
      await this.service.update(user.sub, type, dto),
      'Prompt template updated',
    );
  }

  @Post(':type/reset')
  @ApiOperation({ summary: 'Restore a prompt template to its built-in default' })
  async reset(@CurrentUser() user: JwtPayload, @Param('type') type: string) {
    return ResponseBuilder.success(
      await this.service.reset(user.sub, type),
      'Prompt template reset',
    );
  }
}
