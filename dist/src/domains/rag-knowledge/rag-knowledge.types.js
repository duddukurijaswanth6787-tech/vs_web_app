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
exports.UploadUrlRequestDto = exports.UpdateKnowledgeSourceDto = exports.CreateKnowledgeSourceDto = exports.KnowledgeSourceStatus = exports.KnowledgeSourceType = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var KnowledgeSourceType;
(function (KnowledgeSourceType) {
    KnowledgeSourceType["TEXT"] = "TEXT";
    KnowledgeSourceType["DOCUMENT"] = "DOCUMENT";
    KnowledgeSourceType["URL"] = "URL";
    KnowledgeSourceType["FAQ"] = "FAQ";
    KnowledgeSourceType["CMS"] = "CMS";
})(KnowledgeSourceType || (exports.KnowledgeSourceType = KnowledgeSourceType = {}));
var KnowledgeSourceStatus;
(function (KnowledgeSourceStatus) {
    KnowledgeSourceStatus["DRAFT"] = "DRAFT";
    KnowledgeSourceStatus["PENDING"] = "PENDING";
    KnowledgeSourceStatus["PROCESSING"] = "PROCESSING";
    KnowledgeSourceStatus["INDEXED"] = "INDEXED";
    KnowledgeSourceStatus["FAILED"] = "FAILED";
    KnowledgeSourceStatus["ARCHIVED"] = "ARCHIVED";
})(KnowledgeSourceStatus || (exports.KnowledgeSourceStatus = KnowledgeSourceStatus = {}));
class CreateKnowledgeSourceDto {
    name;
    sourceType;
    sourceUrl;
    rawText;
}
exports.CreateKnowledgeSourceDto = CreateKnowledgeSourceDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateKnowledgeSourceDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: KnowledgeSourceType }),
    (0, class_validator_1.IsEnum)(KnowledgeSourceType),
    __metadata("design:type", String)
], CreateKnowledgeSourceDto.prototype, "sourceType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], CreateKnowledgeSourceDto.prototype, "sourceUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateKnowledgeSourceDto.prototype, "rawText", void 0);
class UpdateKnowledgeSourceDto {
    name;
    sourceUrl;
    rawText;
}
exports.UpdateKnowledgeSourceDto = UpdateKnowledgeSourceDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateKnowledgeSourceDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], UpdateKnowledgeSourceDto.prototype, "sourceUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateKnowledgeSourceDto.prototype, "rawText", void 0);
class UploadUrlRequestDto {
    fileName;
    mimeType;
    size;
}
exports.UploadUrlRequestDto = UploadUrlRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UploadUrlRequestDto.prototype, "fileName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UploadUrlRequestDto.prototype, "mimeType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UploadUrlRequestDto.prototype, "size", void 0);
//# sourceMappingURL=rag-knowledge.types.js.map