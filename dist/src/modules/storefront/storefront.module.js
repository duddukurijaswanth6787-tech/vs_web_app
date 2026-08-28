"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorefrontModule = void 0;
const common_1 = require("@nestjs/common");
const storefront_controller_1 = require("./storefront.controller");
const storefront_public_controller_1 = require("./storefront-public.controller");
const storefront_service_1 = require("./storefront.service");
const theme_service_1 = require("./theme.service");
const storefront_public_service_1 = require("./storefront-public.service");
const audit_module_1 = require("../../domains/audit/audit.module");
const products_module_1 = require("../../domains/products/products.module");
let StorefrontModule = class StorefrontModule {
};
exports.StorefrontModule = StorefrontModule;
exports.StorefrontModule = StorefrontModule = __decorate([
    (0, common_1.Module)({
        imports: [audit_module_1.AuditModule, products_module_1.ProductsModule],
        controllers: [storefront_controller_1.StorefrontController, storefront_public_controller_1.StorefrontPublicController],
        providers: [theme_service_1.ThemeService, storefront_service_1.StorefrontService, storefront_public_service_1.StorefrontPublicService],
    })
], StorefrontModule);
//# sourceMappingURL=storefront.module.js.map