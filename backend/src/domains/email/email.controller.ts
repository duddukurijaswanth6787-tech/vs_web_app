import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { SendEmailDto } from './email.types';
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

  @Post('send')
  @ApiOperation({ summary: 'Send a custom email' })
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
