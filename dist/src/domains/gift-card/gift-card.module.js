"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GiftCardModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const audit_module_1 = require("../audit/audit.module");
const gift_card_controller_1 = require("./gift-card.controller");
const gift_card_service_1 = require("./gift-card.service");
let GiftCardModule = class GiftCardModule {
};
exports.GiftCardModule = GiftCardModule;
exports.GiftCardModule = GiftCardModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, audit_module_1.AuditModule],
        controllers: [gift_card_controller_1.GiftCardController],
        providers: [gift_card_service_1.GiftCardService],
        exports: [gift_card_service_1.GiftCardService],
    })
], GiftCardModule);
//# sourceMappingURL=gift-card.module.js.map