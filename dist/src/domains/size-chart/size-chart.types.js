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
exports.SizeChartTemplateResponse = exports.SizeChartRowResponse = exports.SizeChartQueryDto = exports.UpdateSizeChartTemplateDto = exports.CreateSizeChartTemplateDto = exports.SizeChartRowDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class SizeChartRowDto {
    size;
    measurements;
    displayOrder;
}
exports.SizeChartRowDto = SizeChartRowDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Size label, e.g. M' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SizeChartRowDto.prototype, "size", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Measurement name to value, e.g. { "Bust": 38, "Waist": 34 }',
        type: 'object',
        additionalProperties: true,
    }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SizeChartRowDto.prototype, "measurements", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SizeChartRowDto.prototype, "displayOrder", void 0);
class CreateSizeChartTemplateDto {
    name;
    slug;
    description;
    garmentType;
    unit;
    rows;
}
exports.CreateSizeChartTemplateDto = CreateSizeChartTemplateDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSizeChartTemplateDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSizeChartTemplateDto.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSizeChartTemplateDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Kurta, Saree Blouse, Lehenga …' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSizeChartTemplateDto.prototype, "garmentType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 'inch' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSizeChartTemplateDto.prototype, "unit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [SizeChartRowDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SizeChartRowDto),
    __metadata("design:type", Array)
], CreateSizeChartTemplateDto.prototype, "rows", void 0);
class UpdateSizeChartTemplateDto {
    name;
    description;
    garmentType;
    unit;
    status;
    rows;
}
exports.UpdateSizeChartTemplateDto = UpdateSizeChartTemplateDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSizeChartTemplateDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSizeChartTemplateDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSizeChartTemplateDto.prototype, "garmentType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSizeChartTemplateDto.prototype, "unit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSizeChartTemplateDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [SizeChartRowDto],
        description: 'When present, replaces every row on the template.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SizeChartRowDto),
    __metadata("design:type", Array)
], UpdateSizeChartTemplateDto.prototype, "rows", void 0);
class SizeChartQueryDto {
    search;
    garmentType;
    status;
    page;
    limit;
}
exports.SizeChartQueryDto = SizeChartQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SizeChartQueryDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SizeChartQueryDto.prototype, "garmentType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SizeChartQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], SizeChartQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], SizeChartQueryDto.prototype, "limit", void 0);
class SizeChartRowResponse {
    id;
    size;
    measurements;
    displayOrder;
}
exports.SizeChartRowResponse = SizeChartRowResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SizeChartRowResponse.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SizeChartRowResponse.prototype, "size", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: 'object', additionalProperties: true }),
    __metadata("design:type", Object)
], SizeChartRowResponse.prototype, "measurements", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], SizeChartRowResponse.prototype, "displayOrder", void 0);
class SizeChartTemplateResponse {
    id;
    name;
    slug;
    description;
    garmentType;
    unit;
    status;
    rows;
    createdAt;
    updatedAt;
}
exports.SizeChartTemplateResponse = SizeChartTemplateResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SizeChartTemplateResponse.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SizeChartTemplateResponse.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SizeChartTemplateResponse.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], SizeChartTemplateResponse.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], SizeChartTemplateResponse.prototype, "garmentType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SizeChartTemplateResponse.prototype, "unit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SizeChartTemplateResponse.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [SizeChartRowResponse] }),
    __metadata("design:type", Array)
], SizeChartTemplateResponse.prototype, "rows", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], SizeChartTemplateResponse.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], SizeChartTemplateResponse.prototype, "updatedAt", void 0);
//# sourceMappingURL=size-chart.types.js.map