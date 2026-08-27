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
exports.AppSettingService = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
const redis_1 = require("../../infrastructure/redis");
const app_setting_repository_1 = require("./app-setting.repository");
let AppSettingService = class AppSettingService {
    settingRepository;
    auditService;
    cacheService;
    constructor(settingRepository, auditService, cacheService) {
        this.settingRepository = settingRepository;
        this.auditService = auditService;
        this.cacheService = cacheService;
    }
    toResponse(s) {
        return {
            id: s.id,
            key: s.key,
            value: s.value,
            type: s.type,
            group: s.group ?? undefined,
            description: s.description ?? undefined,
            createdAt: s.createdAt,
        };
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 500);
        const result = await this.settingRepository.findAll({
            group: query.group,
            page,
            limit,
        });
        return {
            data: result.data.map((s) => this.toResponse(s)),
            meta: result.meta,
        };
    }
    async findByKey(key) {
        const setting = await this.settingRepository.findByKey(key);
        if (!setting)
            throw new exceptions_1.BusinessException('Setting not found', 'SETTING_001');
        return this.toResponse(setting);
    }
    async create(dto, userId) {
        const existing = await this.settingRepository.findByKey(dto.key);
        if (existing)
            throw new exceptions_1.BusinessException('Setting key already exists', 'SETTING_002');
        const setting = await this.settingRepository.create({
            key: dto.key,
            value: dto.value,
            type: dto.type ?? 'STRING',
            group: dto.group,
            description: dto.description,
        });
        await this.auditService.log({
            action: 'SETTING_CREATED',
            module: 'settings',
            resource: 'setting',
            resourceId: setting.id,
            userId,
            newValue: { key: dto.key },
        });
        await this.cacheService.del('storefront:settings');
        return this.toResponse(setting);
    }
    async update(id, dto, userId) {
        const setting = await this.settingRepository.findById(id);
        if (!setting)
            throw new exceptions_1.BusinessException('Setting not found', 'SETTING_001');
        const updated = await this.settingRepository.update(id, {
            value: dto.value,
            description: dto.description,
        });
        await this.auditService.log({
            action: 'SETTING_UPDATED',
            module: 'settings',
            resource: 'setting',
            resourceId: id,
            userId,
            oldValue: { value: setting.value },
            newValue: { value: dto.value },
        });
        await this.cacheService.del('storefront:settings');
        return this.toResponse(updated);
    }
    async getByKey(key, defaultValue) {
        const value = await this.settingRepository.getByKey(key);
        return value ?? defaultValue ?? null;
    }
    async getPublicSettingsFallback() {
        const [autoplaySetting, enabledSetting, mobileAnnouncementSetting, announcementTextSetting, announcementEnabledSetting, announcementLinkSetting, announcementLinkTextSetting, announcementBgColorSetting, announcementTextColorSetting,] = await Promise.all([
            this.settingRepository.findByKey('banner_autoplay_interval'),
            this.settingRepository.findByKey('banner_autoplay_enabled'),
            this.settingRepository.findByKey('announcement_bar_mobile_enabled'),
            this.settingRepository.findByKey('announcement_bar_text'),
            this.settingRepository.findByKey('announcement_bar_enabled'),
            this.settingRepository.findByKey('announcement_bar_link'),
            this.settingRepository.findByKey('announcement_bar_link_text'),
            this.settingRepository.findByKey('announcement_bar_bg_color'),
            this.settingRepository.findByKey('announcement_bar_text_color'),
        ]);
        const announcementText = announcementTextSetting ? announcementTextSetting.value : 'Festive Sale is Live! Get up to 30% OFF';
        const mobileEnabled = mobileAnnouncementSetting ? mobileAnnouncementSetting.value === 'true' : true;
        const autoplayInterval = autoplaySetting ? parseInt(autoplaySetting.value, 10) : 5;
        const autoplayEnabled = enabledSetting ? enabledSetting.value === 'true' : true;
        const announcementEnabled = announcementEnabledSetting ? announcementEnabledSetting.value === 'true' : true;
        const announcementLink = announcementLinkSetting ? announcementLinkSetting.value : '/offers';
        const announcementLinkText = announcementLinkTextSetting ? announcementLinkTextSetting.value : 'Shop Now →';
        const announcementBgColor = announcementBgColorSetting ? announcementBgColorSetting.value : '#0284c7';
        const announcementTextColor = announcementTextColorSetting ? announcementTextColorSetting.value : '#FFFFFF';
        return {
            bannerAutoplayInterval: autoplayInterval,
            bannerAutoplayEnabled: autoplayEnabled,
            announcementBarEnabled: announcementEnabled,
            announcementBarMobileEnabled: mobileEnabled,
            announcementBarText: announcementText,
            announcementBarLink: announcementLink,
            announcementBarLinkText: announcementLinkText,
            announcementBarBgColor: announcementBgColor,
            announcementBarTextColor: announcementTextColor,
            announcement_bar_enabled: announcementEnabled,
            announcement_bar_text: announcementText,
            announcement_bar_mobile_enabled: mobileEnabled,
            announcement_bar_link: announcementLink,
            announcement_bar_link_text: announcementLinkText,
            announcement_bar_bg_color: announcementBgColor,
            announcement_bar_text_color: announcementTextColor,
            banner_autoplay_interval: autoplayInterval,
            banner_autoplay_enabled: autoplayEnabled,
        };
    }
};
exports.AppSettingService = AppSettingService;
exports.AppSettingService = AppSettingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [app_setting_repository_1.AppSettingRepository,
        audit_service_1.AuditService,
        redis_1.CacheService])
], AppSettingService);
//# sourceMappingURL=app-setting.service.js.map