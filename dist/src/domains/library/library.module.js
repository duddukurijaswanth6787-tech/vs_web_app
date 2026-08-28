"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LibraryModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const audit_module_1 = require("../audit/audit.module");
const storage_module_1 = require("../../infrastructure/storage/storage.module");
const library_controller_1 = require("./library.controller");
const library_service_1 = require("./library.service");
const library_repository_1 = require("./library.repository");
let LibraryModule = class LibraryModule {
};
exports.LibraryModule = LibraryModule;
exports.LibraryModule = LibraryModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, audit_module_1.AuditModule, storage_module_1.StorageModule],
        controllers: [library_controller_1.LibraryController],
        providers: [library_service_1.LibraryService, library_repository_1.LibraryRepository],
        exports: [library_service_1.LibraryService],
    })
], LibraryModule);
//# sourceMappingURL=library.module.js.map