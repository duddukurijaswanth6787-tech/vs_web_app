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
exports.SessionSettingsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_setting_repository_1 = require("../../app-setting/app-setting.repository");
const audit_service_1 = require("../../audit/audit.service");
const GROUP = 'session_settings';
const KEYS = {
    accessTokenMinutes: 'session.access_token_minutes',
    rememberMeAccessTokenDays: 'session.remember_me_access_token_days',
    refreshTokenDays: 'session.refresh_token_days',
    rememberMeRefreshTokenDays: 'session.remember_me_refresh_token_days',
};
let SessionSettingsService = class SessionSettingsService {
    configService;
    settingRepository;
    auditService;
    constructor(configService, settingRepository, auditService) {
        this.configService = configService;
        this.settingRepository = settingRepository;
        this.auditService = auditService;
    }
    async getInt(key, fallback) {
        const raw = await this.settingRepository.getByKey(key);
        const parsed = raw ? parseInt(raw, 10) : NaN;
        return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
    }
    async getSettings() {
        const [accessTokenMinutes, rememberMeAccessTokenDays, refreshTokenDays, rememberMeRefreshTokenDays] = await Promise.all([
            this.getInt(KEYS.accessTokenMinutes, Math.round(this.configService.get('app.jwt.expiresIn', 900) / 60)),
            this.getInt(KEYS.rememberMeAccessTokenDays, Math.round(this.configService.get('app.jwt.rememberMeExpiresIn', 2592000) / 86400)),
            this.getInt(KEYS.refreshTokenDays, this.configService.get('app.jwt.refreshTokenExpiryDays', 7)),
            this.getInt(KEYS.rememberMeRefreshTokenDays, 30),
        ]);
        return { accessTokenMinutes, rememberMeAccessTokenDays, refreshTokenDays, rememberMeRefreshTokenDays };
    }
    async updateSettings(dto, userId) {
        const updates = [
            [KEYS.accessTokenMinutes, dto.accessTokenMinutes, 'Access token validity in minutes (normal login)'],
            [
                KEYS.rememberMeAccessTokenDays,
                dto.rememberMeAccessTokenDays,
                'Access token validity in days ("Remember me" login)',
            ],
            [KEYS.refreshTokenDays, dto.refreshTokenDays, 'Refresh token / session validity in days (normal login)'],
            [
                KEYS.rememberMeRefreshTokenDays,
                dto.rememberMeRefreshTokenDays,
                'Refresh token / session validity in days ("Remember me" login)',
            ],
        ];
        for (const [key, value, description] of updates) {
            if (value === undefined)
                continue;
            const existing = await this.settingRepository.findByKey(key);
            if (existing) {
                await this.settingRepository.update(existing.id, { value: String(value) });
            }
            else {
                await this.settingRepository.create({ key, value: String(value), group: GROUP, description });
            }
        }
        await this.auditService.log({
            action: 'SESSION_EXPIRY_SETTINGS_UPDATED',
            module: 'auth',
            resource: 'app_setting',
            userId,
            newValue: { ...dto },
        });
        return this.getSettings();
    }
};
exports.SessionSettingsService = SessionSettingsService;
exports.SessionSettingsService = SessionSettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        app_setting_repository_1.AppSettingRepository,
        audit_service_1.AuditService])
], SessionSettingsService);
//# sourceMappingURL=session-settings.service.js.map