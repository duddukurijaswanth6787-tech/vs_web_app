"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarehouseModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const audit_module_1 = require("../audit/audit.module");
const warehouse_controller_1 = require("./warehouse.controller");
const warehouse_service_1 = require("./warehouse.service");
const warehouse_repository_1 = require("./warehouse.repository");
let WarehouseModule = class WarehouseModule {
};
exports.WarehouseModule = WarehouseModule;
exports.WarehouseModule = WarehouseModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, audit_module_1.AuditModule],
        controllers: [warehouse_controller_1.WarehouseController],
        providers: [warehouse_service_1.WarehouseService, warehouse_repository_1.WarehouseRepository],
        exports: [warehouse_service_1.WarehouseService],
    })
], WarehouseModule);
//# sourceMappingURL=warehouse.module.js.map