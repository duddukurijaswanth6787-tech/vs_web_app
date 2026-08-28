"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefundModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const audit_module_1 = require("../audit/audit.module");
const payment_module_1 = require("../payment/payment.module");
const refund_controller_1 = require("./refund.controller");
const refund_service_1 = require("./refund.service");
const refund_repository_1 = require("./refund.repository");
let RefundModule = class RefundModule {
};
exports.RefundModule = RefundModule;
exports.RefundModule = RefundModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, audit_module_1.AuditModule, payment_module_1.PaymentModule],
        controllers: [refund_controller_1.RefundController],
        providers: [refund_service_1.RefundService, refund_repository_1.RefundRepository],
        exports: [refund_service_1.RefundService],
    })
], RefundModule);
//# sourceMappingURL=refund.module.js.map