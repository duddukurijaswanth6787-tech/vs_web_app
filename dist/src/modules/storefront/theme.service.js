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
exports.ThemeService = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("../../common/exceptions");
const prisma_service_1 = require("../../database/prisma.service");
const audit_service_1 = require("../../domains/audit/audit.service");
const theme_types_1 = require("./theme.types");
const THEME_SETTING_KEY = 'storefront.theme.colors';
let ThemeService = class ThemeService {
    prisma;
    auditService;
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async getColors() {
        const row = await this.prisma.appSetting.findUnique({
            where: { key: THEME_SETTING_KEY },
        });
        if (!row?.value)
            return {};
        let parsed;
        try {
            parsed = JSON.parse(row.value);
        }
        catch {
            return {};
        }
        if (!parsed || typeof parsed !== 'object')
            return {};
        const safe = {};
        for (const [token, value] of Object.entries(parsed)) {
            if (token in theme_types_1.THEME_TOKENS && (0, theme_types_1.isHexColor)(value)) {
                safe[token] = value.trim().toLowerCase();
            }
        }
        return safe;
    }
    async getTheme() {
        const colors = await this.getColors();
        return {
            colors: { ...theme_types_1.THEME_TOKENS, ...colors },
            defaults: { ...theme_types_1.THEME_TOKENS },
            sections: theme_types_1.THEME_SECTIONS,
        };
    }
    async updateColors(userId, incoming) {
        const current = await this.getColors();
        const next = { ...current };
        for (const [token, value] of Object.entries(incoming ?? {})) {
            if (!(token in theme_types_1.THEME_TOKENS)) {
                throw new exceptions_1.BusinessException(`Unknown theme section "${token}"`, 'THEME_UNKNOWN_TOKEN');
            }
            if (value === null || value === undefined || value === '') {
                delete next[token];
                continue;
            }
            if (!(0, theme_types_1.isHexColor)(value)) {
                throw new exceptions_1.BusinessException(`"${token}" must be a hex colour like #0284c7`, 'THEME_INVALID_COLOR');
            }
            next[token] = value.trim().toLowerCase();
        }
        await this.prisma.appSetting.upsert({
            where: { key: THEME_SETTING_KEY },
            create: {
                key: THEME_SETTING_KEY,
                value: JSON.stringify(next),
                type: 'JSON',
                group: 'theme',
                description: 'Per-section storefront colours',
            },
            update: { value: JSON.stringify(next) },
        });
        await this.auditService.log({
            action: 'STOREFRONT_THEME_UPDATED',
            module: 'storefront',
            resource: 'app_setting',
            resourceId: THEME_SETTING_KEY,
            userId,
            oldValue: current,
            newValue: next,
        });
        return this.getTheme();
    }
    async resetAll(userId) {
        await this.prisma.appSetting.deleteMany({
            where: { key: THEME_SETTING_KEY },
        });
        await this.auditService.log({
            action: 'STOREFRONT_THEME_RESET',
            module: 'storefront',
            resource: 'app_setting',
            resourceId: THEME_SETTING_KEY,
            userId,
        });
        return this.getTheme();
    }
    isToken(value) {
        return value in theme_types_1.THEME_TOKENS;
    }
};
exports.ThemeService = ThemeService;
exports.ThemeService = ThemeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], ThemeService);
//# sourceMappingURL=theme.service.js.map