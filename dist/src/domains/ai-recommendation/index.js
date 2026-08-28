"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiRecommendationService = exports.AiRecommendationModule = void 0;
var ai_recommendation_module_1 = require("./ai-recommendation.module");
Object.defineProperty(exports, "AiRecommendationModule", { enumerable: true, get: function () { return ai_recommendation_module_1.AiRecommendationModule; } });
var ai_recommendation_service_1 = require("./ai-recommendation.service");
Object.defineProperty(exports, "AiRecommendationService", { enumerable: true, get: function () { return ai_recommendation_service_1.AiRecommendationService; } });
__exportStar(require("./ai-recommendation.types"), exports);
//# sourceMappingURL=index.js.map