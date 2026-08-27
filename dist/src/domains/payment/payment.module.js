"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const auth_module_1 = require("../auth/auth.module");
const audit_module_1 = require("../audit/audit.module");
const order_module_1 = require("../order/order.module");
const app_setting_module_1 = require("../app-setting/app-setting.module");
const payment_controller_1 = require("./payment.controller");
const payment_methods_controller_1 = require("./payment-methods.controller");
const payment_settings_controller_1 = require("./payment-settings.controller");
const payment_service_1 = require("./payment.service");
const payment_repository_1 = require("./payment.repository");
let PaymentModule = class PaymentModule {
};
exports.PaymentModule = PaymentModule;
exports.PaymentModule = PaymentModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, auth_module_1.AuthModule, audit_module_1.AuditModule, order_module_1.OrderModule, app_setting_module_1.AppSettingModule],
        controllers: [payment_methods_controller_1.PaymentMethodsController, payment_controller_1.PaymentController, payment_settings_controller_1.PaymentSettingsController],
        providers: [payment_service_1.PaymentService, payment_repository_1.PaymentRepository],
        exports: [payment_service_1.PaymentService],
    })
], PaymentModule);
//# sourceMappingURL=payment.module.js.map