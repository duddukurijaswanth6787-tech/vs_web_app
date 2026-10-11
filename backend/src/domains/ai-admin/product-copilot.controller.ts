import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProductCopilotService } from './product-copilot.service';
import { AnalyzeProductImageDto, CopilotChatDto } from './product-copilot.types';
import { JwtAuthGuard } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';

@ApiTags('AI Product Copilot')
@Controller('ai/copilot')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin', 'staff')
@ApiBearerAuth()
export class ProductCopilotController {
  constructor(private readonly copilotService: ProductCopilotService) {}

  @Post('analyze-photo')
  @ApiOperation({ summary: 'Analyze product photo with AI Vision for auto-cataloging' })
  async analyzePhoto(@Body() dto: AnalyzeProductImageDto) {
    const data = await this.copilotService.analyzeProductPhotos(dto);
    return ResponseBuilder.success(data, 'Product analyzed successfully');
  }

  @Post('chat')
  @ApiOperation({ summary: 'Chat with AI Copilot to refine catalog attributes' })
  async chat(@Body() dto: CopilotChatDto) {
    const response = await this.copilotService.chatWithCopilot(dto);
    return ResponseBuilder.success(response, 'Copilot response ready');
  }
}
