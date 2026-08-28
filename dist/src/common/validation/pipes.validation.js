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
exports.SanitizePipe = exports.TrimPipe = exports.FilterPipe = exports.SortingPipe = exports.PaginationPipe = exports.UUIDPipe = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("../exceptions");
let UUIDPipe = class UUIDPipe {
    transform(value) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (typeof value !== 'string' || !uuidRegex.test(value)) {
            throw new exceptions_1.ValidationException('Parameter must be a valid UUID v4', 'INVALID_INPUT');
        }
        return value;
    }
};
exports.UUIDPipe = UUIDPipe;
exports.UUIDPipe = UUIDPipe = __decorate([
    (0, common_1.Injectable)()
], UUIDPipe);
let PaginationPipe = class PaginationPipe {
    transform(value) {
        if (!value || typeof value !== 'object') {
            return { page: 1, limit: 10, direction: 'asc' };
        }
        const page = Math.max(1, parseInt(value.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(value.limit, 10) || 10));
        const search = typeof value.search === 'string' ? value.search.trim() : undefined;
        const sort = typeof value.sort === 'string' ? value.sort.trim() : undefined;
        const direction = value.direction === 'desc' ? 'desc' : 'asc';
        return { page, limit, search, sort, direction };
    }
};
exports.PaginationPipe = PaginationPipe;
exports.PaginationPipe = PaginationPipe = __decorate([
    (0, common_1.Injectable)()
], PaginationPipe);
let SortingPipe = class SortingPipe {
    allowedFields;
    constructor(allowedFields) {
        this.allowedFields = allowedFields;
    }
    transform(value) {
        if (!value || typeof value !== 'object') {
            return value;
        }
        if (value.sort && this.allowedFields) {
            const sortStr = String(value.sort);
            if (!this.allowedFields.includes(sortStr)) {
                throw new exceptions_1.ValidationException(`Sorting by field '${sortStr}' is not allowed`, 'INVALID_REQUEST');
            }
        }
        return value;
    }
};
exports.SortingPipe = SortingPipe;
exports.SortingPipe = SortingPipe = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Array])
], SortingPipe);
let FilterPipe = class FilterPipe {
    allowedFilters;
    constructor(allowedFilters) {
        this.allowedFilters = allowedFilters;
    }
    transform(value) {
        if (!value || typeof value !== 'object') {
            return value;
        }
        const filtered = {};
        for (const key of this.allowedFilters) {
            if (value[key] !== undefined) {
                filtered[key] = value[key];
            }
        }
        return filtered;
    }
};
exports.FilterPipe = FilterPipe;
exports.FilterPipe = FilterPipe = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Array])
], FilterPipe);
let TrimPipe = class TrimPipe {
    transform(value, metadata) {
        if (metadata.type !== 'body' || !value || typeof value !== 'object') {
            return value;
        }
        return this.trimObject(value);
    }
    trimObject(obj) {
        if (Array.isArray(obj)) {
            return obj.map((item) => this.trimObject(item));
        }
        const trimmed = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                trimmed[key] = value.trim();
            }
            else if (typeof value === 'object' && value !== null) {
                trimmed[key] = this.trimObject(value);
            }
            else {
                trimmed[key] = value;
            }
        }
        return trimmed;
    }
};
exports.TrimPipe = TrimPipe;
exports.TrimPipe = TrimPipe = __decorate([
    (0, common_1.Injectable)()
], TrimPipe);
let SanitizePipe = class SanitizePipe {
    transform(value, metadata) {
        if (metadata.type !== 'body' || !value || typeof value !== 'object') {
            return value;
        }
        return this.sanitizeObject(value);
    }
    sanitizeObject(obj) {
        if (Array.isArray(obj)) {
            return obj.map((item) => this.sanitizeObject(item));
        }
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = value
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#x27;')
                    .replace(/\//g, '&#x2F;');
            }
            else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeObject(value);
            }
            else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
};
exports.SanitizePipe = SanitizePipe;
exports.SanitizePipe = SanitizePipe = __decorate([
    (0, common_1.Injectable)()
], SanitizePipe);
//# sourceMappingURL=pipes.validation.js.map