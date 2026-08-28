"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const storage_constants_1 = require("./storage.constants");
const local_storage_provider_1 = require("./local-storage.provider");
const s3_storage_provider_1 = require("./s3-storage.provider");
const storage_service_1 = require("./storage.service");
const storage_serve_controller_1 = require("./storage-serve.controller");
let StorageModule = class StorageModule {
};
exports.StorageModule = StorageModule;
exports.StorageModule = StorageModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        controllers: [storage_serve_controller_1.StorageServeController],
        providers: [
            local_storage_provider_1.LocalStorageProvider,
            s3_storage_provider_1.S3StorageProvider,
            {
                provide: storage_constants_1.STORAGE_PROVIDER,
                useFactory: (configService, localProvider, s3Provider) => {
                    const provider = configService.get('app.storage.provider', 'local');
                    const env = configService.get('app.env', 'development');
                    if (env === 'production' && provider !== 's3') {
                        throw new Error('STORAGE_PROVIDER must be "s3" in production');
                    }
                    return provider === 's3' ? s3Provider : localProvider;
                },
                inject: [config_1.ConfigService, local_storage_provider_1.LocalStorageProvider, s3_storage_provider_1.S3StorageProvider],
            },
            storage_service_1.StorageService,
        ],
        exports: [storage_service_1.StorageService, storage_constants_1.STORAGE_PROVIDER],
    })
], StorageModule);
//# sourceMappingURL=storage.module.js.map