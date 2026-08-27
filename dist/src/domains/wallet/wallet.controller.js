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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const wallet_service_1 = require("./wallet.service");
const wallet_types_1 = require("./wallet.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let WalletController = class WalletController {
    walletService;
    constructor(walletService) {
        this.walletService = walletService;
    }
    async getWallet(user) {
        const wallet = await this.walletService.getOrCreateWallet(user.sub);
        return response_builder_1.ResponseBuilder.success({
            id: wallet.id,
            customerId: wallet.customerId,
            balance: Number(wallet.balance),
            currency: wallet.currency,
            isActive: wallet.isActive,
            createdAt: wallet.createdAt,
        });
    }
    async getTransactions(user, query) {
        return response_builder_1.ResponseBuilder.success(await this.walletService.getTransactions(user.sub, query));
    }
    async credit(dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.walletService.credit(user.sub, dto), 'Wallet credited');
    }
    async debit(dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.walletService.debit(user.sub, dto), 'Wallet debited');
    }
    async getWalletAdmin(customerId) {
        const wallet = await this.walletService.getOrCreateWalletByCustomerId(customerId);
        return response_builder_1.ResponseBuilder.success({
            id: wallet.id,
            customerId: wallet.customerId,
            balance: Number(wallet.balance),
            currency: wallet.currency,
            isActive: wallet.isActive,
            createdAt: wallet.createdAt,
        });
    }
    async getTransactionsAdmin(customerId, query) {
        return response_builder_1.ResponseBuilder.success(await this.walletService.getTransactionsByCustomerIdAdmin(customerId, query));
    }
    async creditAdmin(customerId, dto, admin) {
        return response_builder_1.ResponseBuilder.success(await this.walletService.creditByCustomerIdAdmin(customerId, dto, admin.sub), 'Wallet credited by Admin');
    }
    async debitAdmin(customerId, dto, admin) {
        return response_builder_1.ResponseBuilder.success(await this.walletService.debitByCustomerIdAdmin(customerId, dto, admin.sub), 'Wallet debited by Admin');
    }
};
exports.WalletController = WalletController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get own wallet' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getWallet", null);
__decorate([
    (0, common_1.Get)('transactions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get transaction history' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, wallet_types_1.WalletTransactionQueryDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getTransactions", null);
__decorate([
    (0, common_1.Post)('credit'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Credit wallet' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [wallet_types_1.CreditWalletDto, Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "credit", null);
__decorate([
    (0, common_1.Post)('debit'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Debit wallet' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [wallet_types_1.DebitWalletDto, Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "debit", null);
__decorate([
    (0, common_1.Get)('admin/customer/:customerId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get wallet details of any customer (Admin only)' }),
    __param(0, (0, common_1.Param)('customerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getWalletAdmin", null);
__decorate([
    (0, common_1.Get)('admin/customer/:customerId/transactions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get wallet transactions of any customer (Admin only)',
    }),
    __param(0, (0, common_1.Param)('customerId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, wallet_types_1.WalletTransactionQueryDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getTransactionsAdmin", null);
__decorate([
    (0, common_1.Post)('admin/customer/:customerId/credit'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Credit wallet of any customer (Admin only)' }),
    __param(0, (0, common_1.Param)('customerId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, wallet_types_1.CreditWalletDto, Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "creditAdmin", null);
__decorate([
    (0, common_1.Post)('admin/customer/:customerId/debit'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Debit wallet of any customer (Admin only)' }),
    __param(0, (0, common_1.Param)('customerId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, wallet_types_1.DebitWalletDto, Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "debitAdmin", null);
exports.WalletController = WalletController = __decorate([
    (0, swagger_1.ApiTags)('Wallet'),
    (0, common_1.Controller)('wallet'),
    __metadata("design:paramtypes", [wallet_service_1.WalletService])
], WalletController);
//# sourceMappingURL=wallet.controller.js.map