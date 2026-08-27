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
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
const customer_profile_repository_1 = require("../customer-profile/customer-profile.repository");
const wallet_repository_1 = require("./wallet.repository");
let WalletService = class WalletService {
    walletRepository;
    profileRepository;
    auditService;
    constructor(walletRepository, profileRepository, auditService) {
        this.walletRepository = walletRepository;
        this.profileRepository = profileRepository;
        this.auditService = auditService;
    }
    async getOrCreateWallet(userId) {
        const profile = await this.profileRepository.findByUserId(userId);
        if (!profile)
            throw new exceptions_1.BusinessException('Customer profile not found', 'WALLET_001');
        let wallet = await this.walletRepository.findByCustomerId(profile.id);
        if (!wallet) {
            wallet = await this.walletRepository.create(profile.id);
        }
        return wallet;
    }
    async getBalance(userId) {
        const wallet = await this.getOrCreateWallet(userId);
        return { balance: Number(wallet.balance), currency: wallet.currency };
    }
    async credit(userId, dto) {
        const wallet = await this.getOrCreateWallet(userId);
        const { wallet: updated, transaction } = await this.walletRepository.updateBalance(wallet.id, dto.amount, 'CREDIT', dto.description, dto.referenceType, dto.referenceId);
        await this.auditService.log({
            action: 'WALLET_CREDIT',
            module: 'wallet',
            resource: 'Wallet',
            resourceId: wallet.id,
            userId,
        });
        return {
            balance: Number(updated.balance),
            transaction: {
                id: transaction.id,
                type: transaction.type,
                amount: Number(transaction.amount),
                balanceAfter: Number(transaction.balanceAfter),
                description: transaction.description ?? undefined,
                referenceType: transaction.referenceType ?? undefined,
                referenceId: transaction.referenceId ?? undefined,
                createdAt: transaction.createdAt,
            },
        };
    }
    async debit(userId, dto) {
        const wallet = await this.getOrCreateWallet(userId);
        if (Number(wallet.balance) < dto.amount) {
            throw new exceptions_1.BusinessException('Insufficient wallet balance', 'WALLET_002');
        }
        const { wallet: updated, transaction } = await this.walletRepository.updateBalance(wallet.id, -dto.amount, 'DEBIT', dto.description, dto.referenceType, dto.referenceId);
        await this.auditService.log({
            action: 'WALLET_DEBIT',
            module: 'wallet',
            resource: 'Wallet',
            resourceId: wallet.id,
            userId,
        });
        return {
            balance: Number(updated.balance),
            transaction: {
                id: transaction.id,
                type: transaction.type,
                amount: Number(transaction.amount),
                balanceAfter: Number(transaction.balanceAfter),
                description: transaction.description ?? undefined,
                referenceType: transaction.referenceType ?? undefined,
                referenceId: transaction.referenceId ?? undefined,
                createdAt: transaction.createdAt,
            },
        };
    }
    async getTransactions(userId, query) {
        const wallet = await this.getOrCreateWallet(userId);
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const result = await this.walletRepository.getTransactions(wallet.id, {
            type: query.type,
            page,
            limit,
        });
        return {
            data: result.data.map((t) => ({
                id: t.id,
                type: t.type,
                amount: Number(t.amount),
                balanceAfter: Number(t.balanceAfter),
                referenceType: t.referenceType ?? undefined,
                referenceId: t.referenceId ?? undefined,
                description: t.description ?? undefined,
                createdAt: t.createdAt,
            })),
            meta: result.meta,
        };
    }
    async getOrCreateWalletByCustomerId(customerId) {
        let wallet = await this.walletRepository.findByCustomerId(customerId);
        if (!wallet) {
            wallet = await this.walletRepository.create(customerId);
        }
        return wallet;
    }
    async getTransactionsByCustomerIdAdmin(customerId, query) {
        const wallet = await this.getOrCreateWalletByCustomerId(customerId);
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const result = await this.walletRepository.getTransactions(wallet.id, {
            type: query.type,
            page,
            limit,
        });
        return {
            data: result.data.map((t) => ({
                id: t.id,
                type: t.type,
                amount: Number(t.amount),
                balanceAfter: Number(t.balanceAfter),
                referenceType: t.referenceType ?? undefined,
                referenceId: t.referenceId ?? undefined,
                description: t.description ?? undefined,
                createdAt: t.createdAt,
            })),
            meta: result.meta,
        };
    }
    async creditByCustomerIdAdmin(customerId, dto, adminUserId) {
        const wallet = await this.getOrCreateWalletByCustomerId(customerId);
        const { wallet: updated, transaction } = await this.walletRepository.updateBalance(wallet.id, dto.amount, 'CREDIT', dto.description, dto.referenceType, dto.referenceId);
        await this.auditService.log({
            action: 'WALLET_CREDIT_ADMIN',
            module: 'wallet',
            resource: 'Wallet',
            resourceId: wallet.id,
            userId: adminUserId,
        });
        return {
            balance: Number(updated.balance),
            transaction: {
                id: transaction.id,
                type: transaction.type,
                amount: Number(transaction.amount),
                balanceAfter: Number(transaction.balanceAfter),
                description: transaction.description ?? undefined,
                createdAt: transaction.createdAt,
            },
        };
    }
    async debitByCustomerIdAdmin(customerId, dto, adminUserId) {
        const wallet = await this.getOrCreateWalletByCustomerId(customerId);
        if (Number(wallet.balance) < dto.amount) {
            throw new exceptions_1.BusinessException('Insufficient wallet balance', 'WALLET_002');
        }
        const { wallet: updated, transaction } = await this.walletRepository.updateBalance(wallet.id, -dto.amount, 'DEBIT', dto.description, dto.referenceType, dto.referenceId);
        await this.auditService.log({
            action: 'WALLET_DEBIT_ADMIN',
            module: 'wallet',
            resource: 'Wallet',
            resourceId: wallet.id,
            userId: adminUserId,
        });
        return {
            balance: Number(updated.balance),
            transaction: {
                id: transaction.id,
                type: transaction.type,
                amount: Number(transaction.amount),
                balanceAfter: Number(transaction.balanceAfter),
                description: transaction.description ?? undefined,
                createdAt: transaction.createdAt,
            },
        };
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [wallet_repository_1.WalletRepository,
        customer_profile_repository_1.CustomerProfileRepository,
        audit_service_1.AuditService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map