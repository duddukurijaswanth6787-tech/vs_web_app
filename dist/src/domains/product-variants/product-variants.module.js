"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductVariantsModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const audit_module_1 = require("../audit/audit.module");
const products_module_1 = require("../products/products.module");
const product_variants_controller_1 = require("./product-variants.controller");
const product_variants_service_1 = require("./product-variants.service");
const product_variants_repository_1 = require("./product-variants.repository");
let ProductVariantsModule = class ProductVariantsModule {
};
exports.ProductVariantsModule = ProductVariantsModule;
exports.ProductVariantsModule = ProductVariantsModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, audit_module_1.AuditModule, products_module_1.ProductsModule],
        controllers: [product_variants_controller_1.ProductVariantsController],
        providers: [product_variants_service_1.ProductVariantsService, product_variants_repository_1.ProductVariantsRepository],
        exports: [product_variants_service_1.ProductVariantsService],
    })
], ProductVariantsModule);
//# sourceMappingURL=product-variants.module.js.map