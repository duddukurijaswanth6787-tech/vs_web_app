"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const audit_module_1 = require("../audit/audit.module");
const invoice_module_1 = require("../invoice/invoice.module");
const cancellation_module_1 = require("../cancellation/cancellation.module");
const email_module_1 = require("../email/email.module");
const otp_gateway_module_1 = require("../otp-gateway/otp-gateway.module");
const order_controller_1 = require("./order.controller");
const me_orders_controller_1 = require("./me-orders.controller");
const order_service_1 = require("./order.service");
const order_repository_1 = require("./order.repository");
const order_workflow_service_1 = require("./order-workflow.service");
let OrderModule = class OrderModule {
};
exports.OrderModule = OrderModule;
exports.OrderModule = OrderModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            audit_module_1.AuditModule,
            invoice_module_1.InvoiceModule,
            (0, common_1.forwardRef)(() => cancellation_module_1.CancellationModule),
            email_module_1.EmailModule,
            otp_gateway_module_1.OtpGatewayModule,
        ],
        controllers: [order_controller_1.OrderController, me_orders_controller_1.MeOrdersController],
        providers: [order_service_1.OrderService, order_repository_1.OrderRepository, order_workflow_service_1.OrderWorkflowService],
        exports: [order_workflow_service_1.OrderWorkflowService],
    })
], OrderModule);
//# sourceMappingURL=order.module.js.map