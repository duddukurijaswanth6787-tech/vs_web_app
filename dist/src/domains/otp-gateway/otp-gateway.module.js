"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpGatewayModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const audit_module_1 = require("../audit/audit.module");
const app_setting_module_1 = require("../app-setting/app-setting.module");
const otp_gateway_controller_1 = require("./otp-gateway.controller");
const otp_gateway_service_1 = require("./otp-gateway.service");
let OtpGatewayModule = class OtpGatewayModule {
};
exports.OtpGatewayModule = OtpGatewayModule;
exports.OtpGatewayModule = OtpGatewayModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, audit_module_1.AuditModule, app_setting_module_1.AppSettingModule],
        controllers: [otp_gateway_controller_1.OtpGatewayController],
        providers: [otp_gateway_service_1.OtpGatewayService],
        exports: [otp_gateway_service_1.OtpGatewayService],
    })
], OtpGatewayModule);
//# sourceMappingURL=otp-gateway.module.js.map