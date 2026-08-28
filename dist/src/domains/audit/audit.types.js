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
exports.CompareVersionResponse = exports.CompareChange = exports.AuditStatsResponse = exports.AuditLogResponse = exports.AuditLogQueryDto = exports.CreateAuditLogDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateAuditLogDto {
    userId;
    staffId;
    action;
    module;
    resource;
    resourceId;
    oldValue;
    newValue;
    ipAddress;
    userAgent;
    requestId;
    correlationId;
    status;
    message;
    metadata;
}
exports.CreateAuditLogDto = CreateAuditLogDto;
class AuditLogQueryDto {
    module;
    action;
    userId;
    staffId;
    resource;
    resourceId;
    status;
    search;
    startDate;
    endDate;
    page;
    limit;
    sortBy;
    sortOrder;
}
exports.AuditLogQueryDto = AuditLogQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuditLogQueryDto.prototype, "module", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuditLogQueryDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuditLogQueryDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuditLogQueryDto.prototype, "staffId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuditLogQueryDto.prototype, "resource", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuditLogQueryDto.prototype, "resourceId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuditLogQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuditLogQueryDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AuditLogQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AuditLogQueryDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], AuditLogQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], AuditLogQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 'createdAt' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuditLogQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['asc', 'desc'], default: 'desc' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AuditLogQueryDto.prototype, "sortOrder", void 0);
class AuditLogResponse {
    id;
    userId;
    staffId;
    action;
    module;
    resource;
    resourceId;
    oldValue;
    newValue;
    ipAddress;
    userAgent;
    status;
    message;
    metadata;
    createdAt;
}
exports.AuditLogResponse = AuditLogResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AuditLogResponse.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], AuditLogResponse.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], AuditLogResponse.prototype, "staffId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AuditLogResponse.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AuditLogResponse.prototype, "module", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AuditLogResponse.prototype, "resource", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], AuditLogResponse.prototype, "resourceId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], AuditLogResponse.prototype, "oldValue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], AuditLogResponse.prototype, "newValue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], AuditLogResponse.prototype, "ipAddress", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], AuditLogResponse.prototype, "userAgent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AuditLogResponse.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], AuditLogResponse.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], AuditLogResponse.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], AuditLogResponse.prototype, "createdAt", void 0);
class AuditStatsResponse {
    total;
    today;
    uniqueUsers;
    modules;
}
exports.AuditStatsResponse = AuditStatsResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], AuditStatsResponse.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], AuditStatsResponse.prototype, "today", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], AuditStatsResponse.prototype, "uniqueUsers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], AuditStatsResponse.prototype, "modules", void 0);
class CompareChange {
    field;
    oldValue;
    newValue;
    changed;
}
exports.CompareChange = CompareChange;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CompareChange.prototype, "field", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], CompareChange.prototype, "oldValue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], CompareChange.prototype, "newValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], CompareChange.prototype, "changed", void 0);
class CompareVersionResponse {
    id;
    action;
    module;
    resource;
    resourceId;
    timestamp;
    changes;
    oldValue;
    newValue;
}
exports.CompareVersionResponse = CompareVersionResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CompareVersionResponse.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CompareVersionResponse.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CompareVersionResponse.prototype, "module", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CompareVersionResponse.prototype, "resource", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CompareVersionResponse.prototype, "resourceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], CompareVersionResponse.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [CompareChange] }),
    __metadata("design:type", Array)
], CompareVersionResponse.prototype, "changes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], CompareVersionResponse.prototype, "oldValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], CompareVersionResponse.prototype, "newValue", void 0);
//# sourceMappingURL=audit.types.js.map