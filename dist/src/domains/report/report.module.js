"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const audit_module_1 = require("../audit/audit.module");
const database_module_1 = require("../../database/database.module");
const storage_module_1 = require("../../infrastructure/storage/storage.module");
const bullmq_1 = require("@nestjs/bullmq");
const report_controller_1 = require("./report.controller");
const report_service_1 = require("./report.service");
const report_export_worker_1 = require("./report-export.worker");
const isBullMQEnabled = process.env.ENABLE_BULLMQ !== 'false';
const imports = [auth_module_1.AuthModule, audit_module_1.AuditModule, database_module_1.DatabaseModule, storage_module_1.StorageModule];
const providers = [report_service_1.ReportService];
if (isBullMQEnabled) {
    imports.push(bullmq_1.BullModule.registerQueue({
        name: 'report-export',
    }));
    providers.push(report_export_worker_1.ReportExportWorker);
}
else {
    providers.push({
        provide: 'BullQueue_report-export',
        useValue: {
            add: async () => ({ id: 'mock-job-id' }),
        },
    });
}
let ReportModule = class ReportModule {
};
exports.ReportModule = ReportModule;
exports.ReportModule = ReportModule = __decorate([
    (0, common_1.Module)({
        imports,
        controllers: [report_controller_1.ReportController],
        providers,
        exports: [report_service_1.ReportService],
    })
], ReportModule);
//# sourceMappingURL=report.module.js.map