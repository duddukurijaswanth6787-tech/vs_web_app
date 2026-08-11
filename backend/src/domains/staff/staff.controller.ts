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
import { CreateStaffDto, UpdateStaffDto, StaffQueryDto } from './staff.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import type { JwtPayload } from '@domains/auth/services/jwt.service';
import { ResponseBuilder } from '@common/responses/response.builder';

@ApiTags('Staff')
@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  @Roles('super_admin', 'admin')
  @ApiOperation({
    summary: 'List all staff with search, pagination, filter, sort',
  })
  async findAll(@Query() query: StaffQueryDto) {
    return ResponseBuilder.success(await this.staffService.findAll(query));
  }

  @Get(':id')
  @Roles('super_admin', 'admin')
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
  @Roles('super_admin', 'admin')
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
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Activate a staff member' })
  async activate(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.staffService.activate(id),
      'Staff activated',
    );
  }

  @Post(':id/deactivate')
  @Roles('super_admin', 'admin')
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
}
