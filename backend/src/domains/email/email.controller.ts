import { Controller, Get, Patch, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { SendEmailDto, UpdateEmailConfigDto, SendTestEmailDto } from './email.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Email')
@Controller('email')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin', 'staff')
@ApiBearerAuth()
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get('config')
  @ApiOperation({ summary: 'Get transactional email configuration (Amazon SES / SendGrid / SMTP)' })
  async getConfig() {
    return ResponseBuilder.success(await this.emailService.getConfig());
  }

  @Patch('config')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Update transactional email configuration (Amazon SES / SendGrid / SMTP)' })
  async updateConfig(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateEmailConfigDto,
  ) {
    return ResponseBuilder.success(
      await this.emailService.updateConfig(dto, user.sub),
      'Email configuration updated successfully',
    );
  }

  @Post('test')
  @ApiOperation({ summary: 'Send a test email to verify SMTP gateway connection' })
  async sendTestEmail(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SendTestEmailDto,
  ) {
    return ResponseBuilder.success(
      await this.emailService.sendTestEmail(dto, user.sub),
      'Test email dispatched',
    );
  }

  @Post('send')
  @ApiOperation({ summary: 'Send a custom transactional email' })
  async send(@CurrentUser() user: JwtPayload, @Body() dto: SendEmailDto) {
    return ResponseBuilder.success(
      await this.emailService.send(dto, user.sub),
      'Email queued',
    );
  }

  @Get('logs')
  @ApiOperation({ summary: 'List email send logs' })
  async logs(@Query('page') page?: string, @Query('limit') limit?: string) {
    return ResponseBuilder.success(
      await this.emailService.listLogs(Number(page) || 1, Number(limit) || 20),
    );
  }
}

