"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReturnRequestModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const audit_module_1 = require("../audit/audit.module");
const order_module_1 = require("../order/order.module");
const return_request_controller_1 = require("./return-request.controller");
const me_returns_controller_1 = require("./me-returns.controller");
const return_request_service_1 = require("./return-request.service");
const return_request_repository_1 = require("./return-request.repository");
let ReturnRequestModule = class ReturnRequestModule {
};
exports.ReturnRequestModule = ReturnRequestModule;
exports.ReturnRequestModule = ReturnRequestModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, audit_module_1.AuditModule, order_module_1.OrderModule],
        controllers: [me_returns_controller_1.MeReturnsController, return_request_controller_1.ReturnRequestController],
        providers: [return_request_service_1.ReturnRequestService, return_request_repository_1.ReturnRequestRepository],
    })
], ReturnRequestModule);
//# sourceMappingURL=return-request.module.js.map