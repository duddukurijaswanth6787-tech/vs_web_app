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
exports.WalletRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let WalletRepository = class WalletRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByCustomerId(customerId) {
        return this.prisma.wallet.findUnique({ where: { customerId } });
    }
    async create(customerId) {
        return this.prisma.wallet.create({
            data: { customer: { connect: { id: customerId } } },
        });
    }
    async updateBalance(walletId, amount, type, description, referenceType, referenceId) {
        return this.prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.update({
                where: { id: walletId },
                data: { balance: { increment: amount } },
            });
            const transaction = await tx.walletTransaction.create({
                data: {
                    wallet: { connect: { id: walletId } },
                    type,
                    amount,
                    balanceAfter: wallet.balance,
                    description,
                    referenceType,
                    referenceId,
                },
            });
            return { wallet, transaction };
        });
    }
    async getTransactions(walletId, params) {
        const { type, page, limit } = params;
        const skip = (page - 1) * limit;
        const where = { walletId };
        if (type)
            where.type = type;
        const [data, total] = await Promise.all([
            this.prisma.walletTransaction.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.walletTransaction.count({ where }),
        ]);
        return {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
                hasNext: page < Math.ceil(total / limit),
                hasPrevious: page > 1,
            },
        };
    }
    async getBalance(walletId) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { id: walletId },
            select: { balance: true },
        });
        return wallet?.balance;
    }
};
exports.WalletRepository = WalletRepository;
exports.WalletRepository = WalletRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WalletRepository);
//# sourceMappingURL=wallet.repository.js.map