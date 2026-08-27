"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const audit_module_1 = require("../audit/audit.module");
const cart_module_1 = require("../cart/cart.module");
const coupon_module_1 = require("../coupon/coupon.module");
const offer_module_1 = require("../offer/offer.module");
const order_module_1 = require("../order/order.module");
const payment_module_1 = require("../payment/payment.module");
const checkout_controller_1 = require("./checkout.controller");
const checkout_service_1 = require("./checkout.service");
let CheckoutModule = class CheckoutModule {
};
exports.CheckoutModule = CheckoutModule;
exports.CheckoutModule = CheckoutModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            audit_module_1.AuditModule,
            cart_module_1.CartModule,
            coupon_module_1.CouponModule,
            offer_module_1.OfferModule,
            order_module_1.OrderModule,
            payment_module_1.PaymentModule,
        ],
        controllers: [checkout_controller_1.CheckoutController],
        providers: [checkout_service_1.CheckoutService],
    })
], CheckoutModule);
//# sourceMappingURL=checkout.module.js.map