"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiRecommendationModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const audit_module_1 = require("../audit/audit.module");
const ai_recommendation_controller_1 = require("./ai-recommendation.controller");
const ai_recommendation_service_1 = require("./ai-recommendation.service");
const ai_recommendation_repository_1 = require("./ai-recommendation.repository");
let AiRecommendationModule = class AiRecommendationModule {
};
exports.AiRecommendationModule = AiRecommendationModule;
exports.AiRecommendationModule = AiRecommendationModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, audit_module_1.AuditModule],
        controllers: [ai_recommendation_controller_1.AiRecommendationController],
        providers: [ai_recommendation_service_1.AiRecommendationService, ai_recommendation_repository_1.AiRecommendationRepository],
    })
], AiRecommendationModule);
//# sourceMappingURL=ai-recommendation.module.js.map