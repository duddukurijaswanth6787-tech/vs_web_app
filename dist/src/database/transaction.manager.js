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
exports.TransactionManager = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma.service");
const database_constants_1 = require("./database.constants");
let TransactionManager = class TransactionManager {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async execute(fn, options) {
        const maxRetries = options?.maxRetries ?? database_constants_1.DATABASE_CONSTANTS.RETRY_COUNT;
        const timeout = options?.timeout ?? database_constants_1.DATABASE_CONSTANTS.TRANSACTION_TIMEOUT;
        let lastError;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await this.prisma.$transaction((tx) => fn(tx), { timeout });
            }
            catch (error) {
                if (attempt < maxRetries &&
                    error instanceof Error &&
                    this.isRetryable(error)) {
                    lastError = error;
                    continue;
                }
                throw error;
            }
        }
        throw lastError ?? new Error('Transaction failed');
    }
    isRetryable(error) {
        const message = error.message || '';
        return message.includes('deadlock') || message.includes('serialization');
    }
};
exports.TransactionManager = TransactionManager;
exports.TransactionManager = TransactionManager = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TransactionManager);
//# sourceMappingURL=transaction.manager.js.map