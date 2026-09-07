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
import { StaffService } from './staff.service';
import {

  CreateStaffDto,
  UpdateStaffDto,
  StaffQueryDto,
  PunchInDto,
  PunchOutDto,
  AttendanceQueryDto,
  CreateStaffTaskDto,
  UpdateStaffTaskDto,
} from './staff.types';

import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { PermissionsGuard, Permissions } from '@domains/auth/guards/permissions.guard';
import type { JwtPayload } from '@domains/auth/services/jwt.service';
import { ResponseBuilder } from '@common/responses/response.builder';

@ApiTags('Staff')
@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  @Permissions('staff:view')
  @ApiOperation({
    summary: 'List all staff with search, pagination, filter, sort',
  })
  async findAll(@Query() query: StaffQueryDto) {
    return ResponseBuilder.success(await this.staffService.findAll(query));
  }

  @Get(':id')
  @Permissions('staff:view')
  @ApiOperation({ summary: 'Get staff by ID' })
  async findById(@Param('id') id: string) {
    return ResponseBuilder.success(await this.staffService.findById(id));
  }

  @Post()
  @Roles('super_admin')
  @ApiOperation({ summary: 'Create a new staff member' })
  async create(@Body() dto: CreateStaffDto, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.created(
      await this.staffService.create(dto, user.sub),
      'Staff created',
    );
  }

  @Patch(':id')
  @Permissions('staff:update')
  @ApiOperation({ summary: 'Update a staff member' })
  async update(@Param('id') id: string, @Body() dto: UpdateStaffDto) {
    return ResponseBuilder.success(
      await this.staffService.update(id, dto),
      'Staff updated',
    );
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Soft delete a staff member' })
  async delete(@Param('id') id: string) {
    await this.staffService.delete(id);
    return ResponseBuilder.deleted('Staff deleted');
  }

  @Post(':id/restore')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Restore a soft-deleted staff member' })
  async restore(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.staffService.restore(id),
      'Staff restored',
    );
  }

  @Post(':id/activate')
  @Permissions('staff:update')
  @ApiOperation({ summary: 'Activate a staff member' })
  async activate(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.staffService.activate(id),
      'Staff activated',
    );
  }

  @Post(':id/deactivate')
  @Permissions('staff:update')
  @ApiOperation({ summary: 'Deactivate a staff member' })
  async deactivate(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.staffService.deactivate(id),
      'Staff deactivated',
    );
  }

  @Post(':id/suspend')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Suspend a staff member' })
  async suspend(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.staffService.suspend(id),
      'Staff suspended',
    );
  }

  @Post(':id/lock')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Lock a staff member account' })
  async lock(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.staffService.lock(id),
      'Staff locked',
    );
  }

  @Post(':id/unlock')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Unlock a staff member account' })
  async unlock(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.staffService.unlock(id),
      'Staff unlocked',
    );
  }

  // ==========================================
  // ATTENDANCE & PUNCH IN/OUT
  // ==========================================

  @Post('attendance/punch-in')
  @ApiOperation({ summary: 'Punch-in daily attendance for logged in staff' })
  async punchIn(@CurrentUser() user: JwtPayload, @Body() dto: PunchInDto) {
    return ResponseBuilder.success(
      await this.staffService.punchIn(user.sub, dto),
      'Punched in successfully',
    );
  }

  @Post('attendance/punch-out')
  @ApiOperation({ summary: 'Punch-out daily attendance for logged in staff' })
  async punchOut(@CurrentUser() user: JwtPayload, @Body() dto: PunchOutDto) {
    return ResponseBuilder.success(
      await this.staffService.punchOut(user.sub, dto),
      'Punched out successfully',
    );
  }

  @Get('attendance/today')
  @ApiOperation({ summary: 'Get current punch-in/out status for logged in staff' })
  async getTodayAttendance(@CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.staffService.getTodayAttendance(user.sub),
    );
  }

  @Get('attendance/admin/live')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Super Admin live attendance roster of all staff' })
  async getAdminLiveRoster(
    @Query('date') date?: string,
    @Query('department') department?: string,
  ) {
    return ResponseBuilder.success(
      await this.staffService.getAdminLiveRoster(date, department),
    );
  }

  @Get('attendance/history')
  @Permissions('staff:view')
  @ApiOperation({ summary: 'Get monthly attendance history calendar records' })
  async getAttendanceHistory(@Query() query: AttendanceQueryDto) {
    return ResponseBuilder.success(
      await this.staffService.getAttendanceHistory(query),
    );
  }

  // ==========================================
  // STAFF TASK MANAGEMENT
  // ==========================================

  @Post('tasks')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Super Admin assign new task to staff' })
  async createTask(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateStaffTaskDto,
  ) {
    return ResponseBuilder.created(
      await this.staffService.createTask(dto, user.sub),
      'Task assigned successfully',
    );
  }

  @Get('tasks/my-tasks')
  @ApiOperation({ summary: 'Get tasks assigned to logged in staff member' })
  async getMyTasks(@CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.staffService.getMyTasks(user.sub),
    );
  }

  @Get('tasks')
  @Permissions('staff:view')
  @ApiOperation({ summary: 'List tasks with filters' })
  async getTasks(
    @Query('staffProfileId') staffProfileId?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    return ResponseBuilder.success(
      await this.staffService.getStaffTasks(staffProfileId, status, priority),
    );
  }

  @Patch('tasks/:id')
  @ApiOperation({ summary: 'Update staff task status or notes' })
  async updateTask(
    @Param('id') id: string,
    @Body() dto: UpdateStaffTaskDto,
  ) {
    return ResponseBuilder.success(
      await this.staffService.updateTask(id, dto),
      'Task updated',
    );
  }

  // ==========================================
  // PERFORMANCE & ERP SUMMARY
  // ==========================================

  @Get('performance/:staffProfileId')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Get ERP staff performance & payable hours summary' })
  async getStaffPerformance(
    @Param('staffProfileId') staffProfileId: string,
    @Query('month') month?: string,
  ) {
    return ResponseBuilder.success(
      await this.staffService.getStaffPerformanceReport(staffProfileId, month),
    );
  }
}

