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
exports.PaymentMethodsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const prisma_service_1 = require("../../database/prisma.service");
const response_builder_1 = require("../../common/responses/response.builder");
let PaymentMethodsController = class PaymentMethodsController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMethods() {
        const settings = await this.prisma.appSetting.findMany({
            where: { group: 'payment' },
        });
        const map = new Map(settings.map((s) => [s.key, s.value]));
        const getBool = (key, def) => {
            const v = map.get(key);
            return v !== undefined ? v === 'true' : def;
        };
        const getNum = (key, def) => {
            const v = map.get(key);
            return v !== undefined ? Number(v) || def : def;
        };
        const getStr = (key, def) => map.get(key) || def;
        const methods = [
            {
                code: 'razorpay',
                title: getStr('payment_razorpay_title', 'Online Payment'),
                description: getStr('payment_razorpay_description', 'Pay securely using UPI, Cards, Net Banking'),
                enabled: getBool('payment_razorpay_enabled', true),
                displayOrder: getNum('payment_razorpay_display_order', 1),
                icon: getStr('payment_razorpay_icon', ''),
                minAmount: getNum('payment_razorpay_min_amount', 0),
                maxAmount: getNum('payment_razorpay_max_amount', 999999),
            },
            {
                code: 'cod',
                title: getStr('payment_cod_title', 'Cash On Delivery'),
                description: getStr('payment_cod_description', 'Pay when the order is delivered'),
                enabled: getBool('payment_cod_enabled', true),
                displayOrder: getNum('payment_cod_display_order', 2),
                icon: getStr('payment_cod_icon', ''),
                minAmount: getNum('payment_cod_min_amount', 0),
                maxAmount: getNum('payment_cod_max_amount', 5000),
            },
        ];
        return response_builder_1.ResponseBuilder.success(methods
            .filter((m) => m.enabled)
            .sort((a, b) => a.displayOrder - b.displayOrder));
    }
};
exports.PaymentMethodsController = PaymentMethodsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get available payment methods (public)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PaymentMethodsController.prototype, "getMethods", null);
exports.PaymentMethodsController = PaymentMethodsController = __decorate([
    (0, swagger_1.ApiTags)('Payment Methods'),
    (0, common_1.Controller)('payment-methods'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentMethodsController);
//# sourceMappingURL=payment-methods.controller.js.map