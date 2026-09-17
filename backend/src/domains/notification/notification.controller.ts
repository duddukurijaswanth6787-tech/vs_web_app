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
import { NotificationService } from './notification.service';
import { NotificationQueryDto, ReportClientErrorDto } from './notification.types';
import { JwtAuthGuard, CurrentUser, Public } from '@domains/auth/guards/jwt-auth.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('client-error')
  @Public()
  @ApiOperation({ summary: 'Report client runtime or API error and notify admins' })
  async reportClientError(@Body() dto: ReportClientErrorDto) {
    const errorPrefix = dto.errorCode ? `[${dto.errorCode}] ` : '';
    const title = `🚨 Customer Error: ${errorPrefix}${dto.message.slice(0, 50)}`;
    const pageInfo = dto.url ? ` on ${dto.url}` : '';
    const statusInfo = dto.status ? ` (Status ${dto.status})` : '';
    const message = `A user encountered an error${pageInfo}${statusInfo}: ${dto.message}`;

    await this.notificationService.notifyAdmins(
      'USER_ERROR',
      title,
      message,
      {
        url: dto.url,
        status: dto.status,
        errorCode: dto.errorCode,
        stack: dto.stack ? dto.stack.slice(0, 500) : undefined,
        userAgent: dto.userAgent,
        customerId: dto.customerId || 'Guest',
        reportedAt: new Date().toISOString(),
        metadata: dto.metadata,
      },
    );

    return ResponseBuilder.success({ reported: true }, 'Client error recorded');
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List own notifications' })
  async findAll(
    @Query() query: NotificationQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.notificationService.findAll(user.sub, query),
    );
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success({
      count: await this.notificationService.getUnreadCount(user.sub),
    });
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notification stats' })
  async getStats(@CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.notificationService.getStats(user.sub),
    );
  }

  @Patch('read-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser() user: JwtPayload) {
    await this.notificationService.markAllAsRead(user.sub);
    return ResponseBuilder.success(null, 'All notifications marked as read');
  }

  @Delete('read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete all read notifications' })
  async deleteAllRead(@CurrentUser() user: JwtPayload) {
    const count = await this.notificationService.deleteAllRead(user.sub);
    return ResponseBuilder.success(
      { count },
      `${count} read notification(s) deleted`,
    );
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markAsRead(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.notificationService.markAsRead(id, user.sub),
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a notification' })
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.notificationService.delete(id, user.sub);
    return ResponseBuilder.deleted('Notification deleted');
  }
}
