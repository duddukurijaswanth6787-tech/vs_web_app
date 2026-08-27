"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DtdcModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const audit_module_1 = require("../audit/audit.module");
const dtdc_controller_1 = require("./dtdc.controller");
const dtdc_service_1 = require("./dtdc.service");
let DtdcModule = class DtdcModule {
};
exports.DtdcModule = DtdcModule;
exports.DtdcModule = DtdcModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, audit_module_1.AuditModule],
        controllers: [dtdc_controller_1.DtdcController],
        providers: [dtdc_service_1.DtdcService],
        exports: [dtdc_service_1.DtdcService],
    })
], DtdcModule);
//# sourceMappingURL=dtdc.module.js.map