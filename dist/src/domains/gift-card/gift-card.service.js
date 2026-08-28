"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GiftCardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
const crypto = __importStar(require("crypto"));
let GiftCardService = class GiftCardService {
    prisma;
    auditService;
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    generateCode() {
        return `GC${crypto.randomBytes(4).toString('hex').toUpperCase()}${Date.now().toString().slice(-4)}`;
    }
    toResponse(card) {
        return {
            id: card.id,
            code: card.code,
            initialAmount: Number(card.initialAmount),
            balance: Number(card.balance),
            currency: card.currency,
            status: card.status,
            recipientEmail: card.recipientEmail ?? undefined,
            recipientPhone: card.recipientPhone ?? undefined,
            expiresAt: card.expiresAt ?? undefined,
            createdAt: card.createdAt,
        };
    }
    async getProfile(userId) {
        const profile = await this.prisma.customerProfile.findUnique({
            where: { userId },
        });
        if (!profile)
            throw new exceptions_1.BusinessException('Customer profile not found', 'CUSTOMER_001');
        return profile;
    }
    async createAdmin(dto, adminId) {
        const code = dto.code?.toUpperCase() || this.generateCode();
        const existing = await this.prisma.giftCard.findUnique({ where: { code } });
        if (existing)
            throw new exceptions_1.BusinessException('Gift card code already exists', 'GIFTCARD_001');
        const card = await this.prisma.giftCard.create({
            data: {
                code,
                initialAmount: dto.amount,
                balance: dto.amount,
                recipientEmail: dto.recipientEmail,
                recipientPhone: dto.recipientPhone,
                message: dto.message,
                expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
                createdBy: adminId,
                status: 'ACTIVE',
            },
        });
        await this.auditService.log({
            action: 'GIFTCARD_CREATED',
            module: 'gift-card',
            resource: 'gift_card',
            resourceId: card.id,
            userId: adminId,
            newValue: { code, amount: dto.amount },
        });
        return this.toResponse(card);
    }
    async purchase(userId, dto) {
        const profile = await this.getProfile(userId);
        const code = this.generateCode();
        const card = await this.prisma.giftCard.create({
            data: {
                code,
                initialAmount: dto.amount,
                balance: dto.amount,
                purchaserId: profile.id,
                recipientEmail: dto.recipientEmail,
                recipientPhone: dto.recipientPhone,
                message: dto.message,
                status: 'ACTIVE',
            },
        });
        await this.auditService.log({
            action: 'GIFTCARD_PURCHASED',
            module: 'gift-card',
            resource: 'gift_card',
            resourceId: card.id,
            userId,
            newValue: { code, amount: dto.amount },
        });
        return this.toResponse(card);
    }
    async getBalance(code) {
        const card = await this.prisma.giftCard.findUnique({
            where: { code: code.toUpperCase() },
        });
        if (!card)
            throw new exceptions_1.BusinessException('Gift card not found', 'GIFTCARD_002');
        return this.toResponse(card);
    }
    async redeem(userId, dto) {
        const profile = await this.getProfile(userId);
        const card = await this.prisma.giftCard.findUnique({
            where: { code: dto.code.toUpperCase() },
        });
        if (!card)
            throw new exceptions_1.BusinessException('Gift card not found', 'GIFTCARD_002');
        if (card.status !== 'ACTIVE')
            throw new exceptions_1.BusinessException('Gift card is not active', 'GIFTCARD_003');
        if (card.expiresAt && card.expiresAt < new Date()) {
            await this.prisma.giftCard.update({
                where: { id: card.id },
                data: { status: 'EXPIRED' },
            });
            throw new exceptions_1.BusinessException('Gift card expired', 'GIFTCARD_004');
        }
        const balance = Number(card.balance);
        if (balance < dto.amount)
            throw new exceptions_1.BusinessException('Insufficient gift card balance', 'GIFTCARD_005');
        const balanceAfter = balance - dto.amount;
        const [updated] = await this.prisma.$transaction([
            this.prisma.giftCard.update({
                where: { id: card.id },
                data: {
                    balance: balanceAfter,
                    status: balanceAfter <= 0 ? 'REDEEMED' : 'ACTIVE',
                },
            }),
            this.prisma.giftCardRedemption.create({
                data: {
                    giftCardId: card.id,
                    customerId: profile.id,
                    amount: dto.amount,
                    orderId: dto.orderId,
                    balanceAfter,
                },
            }),
        ]);
        await this.auditService.log({
            action: 'GIFTCARD_REDEEMED',
            module: 'gift-card',
            resource: 'gift_card',
            resourceId: card.id,
            userId,
            newValue: { amount: dto.amount, balanceAfter },
        });
        return this.toResponse(updated);
    }
    async listAdmin(page = 1, limit = 20) {
        const take = Math.min(limit, 100);
        const [data, total] = await Promise.all([
            this.prisma.giftCard.findMany({
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * take,
                take,
            }),
            this.prisma.giftCard.count(),
        ]);
        return {
            data: data.map((c) => this.toResponse(c)),
            meta: { page, limit: take, total },
        };
    }
};
exports.GiftCardService = GiftCardService;
exports.GiftCardService = GiftCardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], GiftCardService);
//# sourceMappingURL=gift-card.service.js.map