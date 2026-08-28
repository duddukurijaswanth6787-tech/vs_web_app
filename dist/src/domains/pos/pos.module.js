"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PosModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../../database/database.module");
const order_module_1 = require("../order/order.module");
const audit_module_1 = require("../audit/audit.module");
const pos_controller_1 = require("./pos.controller");
const pos_service_1 = require("./pos.service");
const pos_repository_1 = require("./pos.repository");
const pos_gateway_1 = require("./pos.gateway");
const barcode_service_1 = require("./barcode.service");
const printer_service_1 = require("./printer.service");
let PosModule = class PosModule {
};
exports.PosModule = PosModule;
exports.PosModule = PosModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, order_module_1.OrderModule, audit_module_1.AuditModule],
        controllers: [pos_controller_1.PosController],
        providers: [
            pos_repository_1.PosRepository,
            pos_service_1.PosService,
            pos_gateway_1.PosGateway,
            barcode_service_1.BarcodeService,
            printer_service_1.PrinterService,
        ],
        exports: [pos_service_1.PosService, pos_gateway_1.PosGateway, barcode_service_1.BarcodeService, printer_service_1.PrinterService],
    })
], PosModule);
//# sourceMappingURL=pos.module.js.map