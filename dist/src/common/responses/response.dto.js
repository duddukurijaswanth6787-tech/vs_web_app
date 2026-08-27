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
exports.PaginatedApiResponse = exports.PaginationMeta = exports.StandardApiResponse = void 0;
const swagger_1 = require("@nestjs/swagger");
class StandardApiResponse {
    success;
    message;
    data;
    timestamp;
    correlationId;
    path;
    metadata;
    constructor(partial) {
        Object.assign(this, partial);
    }
}
exports.StandardApiResponse = StandardApiResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], StandardApiResponse.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Request processed successfully' }),
    __metadata("design:type", String)
], StandardApiResponse.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], StandardApiResponse.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-07-09T10:20:00.000Z' }),
    __metadata("design:type", String)
], StandardApiResponse.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'correlation-id-uuid' }),
    __metadata("design:type", String)
], StandardApiResponse.prototype, "correlationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '/api/v1/resource' }),
    __metadata("design:type", String)
], StandardApiResponse.prototype, "path", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: 'object', additionalProperties: true }),
    __metadata("design:type", Object)
], StandardApiResponse.prototype, "metadata", void 0);
class PaginationMeta {
    page;
    limit;
    total;
    totalPages;
    hasNext;
    hasPrevious;
}
exports.PaginationMeta = PaginationMeta;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], PaginationMeta.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10 }),
    __metadata("design:type", Number)
], PaginationMeta.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 100 }),
    __metadata("design:type", Number)
], PaginationMeta.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10 }),
    __metadata("design:type", Number)
], PaginationMeta.prototype, "totalPages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], PaginationMeta.prototype, "hasNext", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false }),
    __metadata("design:type", Boolean)
], PaginationMeta.prototype, "hasPrevious", void 0);
class PaginatedApiResponse extends StandardApiResponse {
}
exports.PaginatedApiResponse = PaginatedApiResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ type: () => PaginationMeta }),
    __metadata("design:type", Object)
], PaginatedApiResponse.prototype, "metadata", void 0);
//# sourceMappingURL=response.dto.js.map