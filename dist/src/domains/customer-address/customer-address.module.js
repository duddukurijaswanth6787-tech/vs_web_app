"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerAddressModule = void 0;
const common_1 = require("@nestjs/common");
const audit_module_1 = require("../audit/audit.module");
const customer_address_service_1 = require("./customer-address.service");
const customer_address_repository_1 = require("./customer-address.repository");
let CustomerAddressModule = class CustomerAddressModule {
};
exports.CustomerAddressModule = CustomerAddressModule;
exports.CustomerAddressModule = CustomerAddressModule = __decorate([
    (0, common_1.Module)({
        imports: [audit_module_1.AuditModule],
        providers: [customer_address_service_1.CustomerAddressService, customer_address_repository_1.CustomerAddressRepository],
        exports: [customer_address_service_1.CustomerAddressService],
    })
], CustomerAddressModule);
//# sourceMappingURL=customer-address.module.js.map