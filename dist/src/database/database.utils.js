"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseUtils = void 0;
const database_constants_1 = require("./database.constants");
class DatabaseUtils {
    static buildPaginationMeta(total, page, limit) {
        const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
        return {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrevious: page > 1,
        };
    }
    static normalizePagination(page, limit) {
        const p = Math.max(1, page || database_constants_1.DATABASE_CONSTANTS.DEFAULT_PAGE_SIZE);
        const l = Math.min(Math.max(1, limit || database_constants_1.DATABASE_CONSTANTS.DEFAULT_PAGE_SIZE), database_constants_1.DATABASE_CONSTANTS.MAX_PAGE_SIZE);
        return { page: p, limit: l, skip: (p - 1) * l };
    }
}
exports.DatabaseUtils = DatabaseUtils;
//# sourceMappingURL=database.utils.js.map