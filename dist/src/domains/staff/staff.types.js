"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffResponse = exports.StaffQueryDto = exports.UpdateStaffDto = exports.CreateStaffDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const identity_enums_1 = require("../../shared/identity/identity.enums");
class CreateStaffDto {
    email;
    password;
    firstName;
    lastName;
    phone;
    department;
    designation;
    employeeId;
    roleId;
    jobTitle;
    reportingManagerId;
    emergencyContact;
    address;
}
exports.CreateStaffDto = CreateStaffDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: identity_enums_1.StaffDepartment }),
    (0, class_validator_1.IsEnum)(identity_enums_1.StaffDepartment),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "department", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: identity_enums_1.StaffDesignation }),
    (0, class_validator_1.IsEnum)(identity_enums_1.StaffDesignation),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "designation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Auto-generated (EMP-0001, EMP-0002, …) when omitted',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Role to grant on creation; defaults to the base "staff" role when omitted',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "roleId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "jobTitle", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "reportingManagerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "emergencyContact", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "address", void 0);
class UpdateStaffDto {
    firstName;
    lastName;
    phone;
    department;
    designation;
    jobTitle;
    reportingManagerId;
    emergencyContact;
    address;
    profileImage;
}
exports.UpdateStaffDto = UpdateStaffDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], UpdateStaffDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], UpdateStaffDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateStaffDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: identity_enums_1.StaffDepartment }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(identity_enums_1.StaffDepartment),
    __metadata("design:type", String)
], UpdateStaffDto.prototype, "department", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: identity_enums_1.StaffDesignation }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(identity_enums_1.StaffDesignation),
    __metadata("design:type", String)
], UpdateStaffDto.prototype, "designation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateStaffDto.prototype, "jobTitle", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateStaffDto.prototype, "reportingManagerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateStaffDto.prototype, "emergencyContact", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateStaffDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateStaffDto.prototype, "profileImage", void 0);
class StaffQueryDto {
    search;
    department;
    designation;
    employmentStatus;
    page;
    limit;
    sortBy;
    sortOrder;
}
exports.StaffQueryDto = StaffQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StaffQueryDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: identity_enums_1.StaffDepartment }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(identity_enums_1.StaffDepartment),
    __metadata("design:type", String)
], StaffQueryDto.prototype, "department", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: identity_enums_1.StaffDesignation }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(identity_enums_1.StaffDesignation),
    __metadata("design:type", String)
], StaffQueryDto.prototype, "designation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StaffQueryDto.prototype, "employmentStatus", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], StaffQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 10 }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], StaffQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 'createdAt' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StaffQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['asc', 'desc'], default: 'desc' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], StaffQueryDto.prototype, "sortOrder", void 0);
class StaffResponse {
    id;
    userId;
    email;
    firstName;
    lastName;
    department;
    designation;
    employeeId;
    jobTitle;
    reportingManagerId;
    employmentStatus;
    accountStatus;
    joinedAt;
    phone;
    profileImage;
    createdAt;
}
exports.StaffResponse = StaffResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StaffResponse.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StaffResponse.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StaffResponse.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StaffResponse.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], StaffResponse.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StaffResponse.prototype, "department", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StaffResponse.prototype, "designation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StaffResponse.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], StaffResponse.prototype, "jobTitle", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], StaffResponse.prototype, "reportingManagerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StaffResponse.prototype, "employmentStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StaffResponse.prototype, "accountStatus", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Date)
], StaffResponse.prototype, "joinedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], StaffResponse.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], StaffResponse.prototype, "profileImage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], StaffResponse.prototype, "createdAt", void 0);
//# sourceMappingURL=staff.types.js.map