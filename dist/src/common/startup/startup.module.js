"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StartupModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../../database/database.module");
const startup_version_service_1 = require("./startup-version.service");
const startup_health_service_1 = require("./startup-health.service");
const startup_info_service_1 = require("./startup-info.service");
const startup_renderer_service_1 = require("./startup-renderer.service");
const startup_service_1 = require("./startup.service");
let StartupModule = class StartupModule {
};
exports.StartupModule = StartupModule;
exports.StartupModule = StartupModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule],
        providers: [
            startup_version_service_1.StartupVersionService,
            startup_health_service_1.StartupHealthService,
            startup_info_service_1.StartupInfoService,
            startup_renderer_service_1.StartupRendererService,
            startup_service_1.StartupDashboardService,
        ],
        exports: [startup_service_1.StartupDashboardService],
    })
], StartupModule);
//# sourceMappingURL=startup.module.js.map