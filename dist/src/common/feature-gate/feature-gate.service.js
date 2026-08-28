"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureGateService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const exceptions_1 = require("../exceptions");
let FeatureGateService = class FeatureGateService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async isEnabled(key) {
        const toggle = await this.prisma.featureToggle.findUnique({
            where: { key },
        });
        return toggle?.enabled === true;
    }
    async assertEnabled(key, featureName) {
        const enabled = await this.isEnabled(key);
        if (!enabled) {
            throw new exceptions_1.BusinessException(`${featureName ?? key} is currently disabled by admin`, 'FEATURE_DISABLED');
        }
    }
};
exports.FeatureGateService = FeatureGateService;
exports.FeatureGateService = FeatureGateService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FeatureGateService);
//# sourceMappingURL=feature-gate.service.js.map