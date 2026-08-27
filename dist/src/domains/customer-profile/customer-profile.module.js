"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerProfileModule = void 0;
const common_1 = require("@nestjs/common");
const audit_module_1 = require("../audit/audit.module");
const otp_module_1 = require("../otp/otp.module");
const customer_profile_service_1 = require("./customer-profile.service");
const customer_profile_repository_1 = require("./customer-profile.repository");
const phone_change_service_1 = require("./phone-change.service");
let CustomerProfileModule = class CustomerProfileModule {
};
exports.CustomerProfileModule = CustomerProfileModule;
exports.CustomerProfileModule = CustomerProfileModule = __decorate([
    (0, common_1.Module)({
        imports: [audit_module_1.AuditModule, otp_module_1.OtpModule],
        providers: [customer_profile_service_1.CustomerProfileService, customer_profile_repository_1.CustomerProfileRepository, phone_change_service_1.PhoneChangeService],
        exports: [customer_profile_service_1.CustomerProfileService, customer_profile_repository_1.CustomerProfileRepository, phone_change_service_1.PhoneChangeService],
    })
], CustomerProfileModule);
//# sourceMappingURL=customer-profile.module.js.map