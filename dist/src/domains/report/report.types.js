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
exports.ExportJobResponse = exports.ReportResponse = exports.GenerateReportDto = exports.ExportFormat = exports.ReportType = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var ReportType;
(function (ReportType) {
    ReportType["SALES"] = "SALES";
    ReportType["INVENTORY"] = "INVENTORY";
    ReportType["CUSTOMER"] = "CUSTOMER";
    ReportType["PAYMENT"] = "PAYMENT";
    ReportType["ORDER"] = "ORDER";
    ReportType["PRODUCTS"] = "PRODUCTS";
    ReportType["COUPONS"] = "COUPONS";
    ReportType["RETURNS"] = "RETURNS";
    ReportType["TAX"] = "TAX";
    ReportType["SHIPPING"] = "SHIPPING";
    ReportType["CATEGORIES"] = "CATEGORIES";
    ReportType["BRANDS"] = "BRANDS";
    ReportType["REVIEWS"] = "REVIEWS";
})(ReportType || (exports.ReportType = ReportType = {}));
var ExportFormat;
(function (ExportFormat) {
    ExportFormat["CSV"] = "CSV";
    ExportFormat["EXCEL"] = "EXCEL";
})(ExportFormat || (exports.ExportFormat = ExportFormat = {}));
class GenerateReportDto {
    type;
    startDate;
    endDate;
    format;
}
exports.GenerateReportDto = GenerateReportDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ReportType }),
    (0, class_validator_1.IsEnum)(ReportType),
    __metadata("design:type", String)
], GenerateReportDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GenerateReportDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GenerateReportDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ExportFormat }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ExportFormat),
    __metadata("design:type", String)
], GenerateReportDto.prototype, "format", void 0);
class ReportResponse {
    type;
    data;
    generatedAt;
}
exports.ReportResponse = ReportResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ReportResponse.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], ReportResponse.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], ReportResponse.prototype, "generatedAt", void 0);
class ExportJobResponse {
    id;
    type;
    format;
    status;
    fileUrl;
    createdAt;
}
exports.ExportJobResponse = ExportJobResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ExportJobResponse.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ExportJobResponse.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ExportJobResponse.prototype, "format", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ExportJobResponse.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], ExportJobResponse.prototype, "fileUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], ExportJobResponse.prototype, "createdAt", void 0);
//# sourceMappingURL=report.types.js.map