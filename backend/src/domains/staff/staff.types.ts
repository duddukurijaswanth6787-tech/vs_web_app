import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsEmail,
  MinLength,
  MaxLength,
} from 'class-validator';
import {
  StaffDepartment,
  StaffDesignation,
} from '@shared/identity/identity.enums';

export class CreateStaffDto {
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsString() @MinLength(8) password!: string;
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(50) firstName!: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiProperty({ enum: StaffDepartment })
  @IsEnum(StaffDepartment)
  department!: StaffDepartment;
  @ApiProperty({ enum: StaffDesignation })
  @IsEnum(StaffDesignation)
  designation!: StaffDesignation;
  @ApiPropertyOptional({
    description: 'Auto-generated (EMP-0001, EMP-0002, …) when omitted',
  })
  @IsOptional()
  @IsString()
  employeeId?: string;
  @ApiPropertyOptional({
    description:
      'Role to grant on creation; defaults to the base "staff" role when omitted',
  })
  @IsOptional()
  @IsString()
  roleId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() jobTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reportingManagerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() emergencyContact?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() joinedAt?: string;
}

export class UpdateStaffDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional({ enum: StaffDepartment })
  @IsOptional()
  @IsEnum(StaffDepartment)
  department?: StaffDepartment;
  @ApiPropertyOptional({ enum: StaffDesignation })
  @IsOptional()
  @IsEnum(StaffDesignation)
  designation?: StaffDesignation;
  @ApiPropertyOptional() @IsOptional() @IsString() jobTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reportingManagerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() emergencyContact?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() profileImage?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() joinedAt?: string;
}

export class StaffQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ enum: StaffDepartment })
  @IsOptional()
  @IsEnum(StaffDepartment)
  department?: StaffDepartment;
  @ApiPropertyOptional({ enum: StaffDesignation })
  @IsOptional()
  @IsEnum(StaffDesignation)
  designation?: StaffDesignation;
  @ApiPropertyOptional() @IsOptional() @IsString() employmentStatus?: string;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() page?: number;
  @ApiPropertyOptional({ default: 10 }) @IsOptional() limit?: number;
  @ApiPropertyOptional({ default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string;
  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

export class StaffResponse {
  @ApiProperty() id!: string;
  @ApiProperty() userId!: string;
  @ApiProperty() email!: string;
  @ApiProperty() firstName!: string;
  @ApiPropertyOptional() lastName?: string;
  @ApiProperty() department!: string;
  @ApiProperty() designation!: string;
  @ApiProperty() employeeId!: string;
  @ApiPropertyOptional() jobTitle?: string;
  @ApiPropertyOptional() reportingManagerId?: string;
  @ApiProperty() employmentStatus!: string;
  @ApiProperty() accountStatus!: string;
  @ApiPropertyOptional() joinedAt?: Date;
  @ApiPropertyOptional() phone?: string;
  @ApiPropertyOptional() profileImage?: string;
  @ApiProperty() createdAt!: Date;
}

export class PunchInDto {
  @ApiPropertyOptional({ default: 'GENERAL' })
  @IsOptional()
  @IsString()
  shiftType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class PunchOutDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  breakMinutes?: number;
}

export class AttendanceQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  date?: string; // YYYY-MM-DD

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  month?: string; // YYYY-MM

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  staffProfileId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

export class StaffAttendanceResponse {
  @ApiProperty() id!: string;
  @ApiProperty() staffProfileId!: string;
  @ApiProperty() employeeId!: string;
  @ApiProperty() staffName!: string;
  @ApiProperty() department!: string;
  @ApiProperty() designation!: string;
  @ApiProperty() date!: string;
  @ApiProperty() punchInAt!: Date;
  @ApiPropertyOptional() punchOutAt?: Date;
  @ApiProperty() totalHours!: number;
  @ApiProperty() breakMinutes!: number;
  @ApiProperty() status!: string;
  @ApiProperty() shiftType!: string;
  @ApiPropertyOptional() punchInLocation?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiProperty() isCurrentlyActive!: boolean;
}

export class CreateStaffTaskDto {
  @ApiProperty()
  @IsString()
  staffProfileId!: string;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'MEDIUM' })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateStaffTaskDto {
  @ApiPropertyOptional({ enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class StaffTaskResponse {
  @ApiProperty() id!: string;
  @ApiProperty() staffProfileId!: string;
  @ApiProperty() staffName!: string;
  @ApiProperty() employeeId!: string;
  @ApiProperty() title!: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() priority!: string;
  @ApiProperty() status!: string;
  @ApiPropertyOptional() dueDate?: Date;
  @ApiPropertyOptional() completedAt?: Date;
  @ApiPropertyOptional() assignedByName?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiProperty() createdAt!: Date;
}

export class StaffPerformanceSummaryResponse {
  @ApiProperty() staffProfileId!: string;
  @ApiProperty() employeeId!: string;
  @ApiProperty() staffName!: string;
  @ApiProperty() department!: string;
  @ApiProperty() designation!: string;
  @ApiProperty() totalWorkingDays!: number;
  @ApiProperty() presentDays!: number;
  @ApiProperty() lateDays!: number;
  @ApiProperty() totalHoursWorked!: number;
  @ApiProperty() attendanceRatePercent!: number;
  @ApiProperty() totalTasksAssigned!: number;
  @ApiProperty() tasksCompleted!: number;
  @ApiProperty() taskCompletionRatePercent!: number;
  @ApiProperty() estimatedPayableHours!: number;
}

