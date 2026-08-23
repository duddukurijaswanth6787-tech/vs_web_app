import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { CacheService } from '@infrastructure/redis';
import { AppSettingRepository } from './app-setting.repository';
import {
  CreateSettingDto,
  UpdateSettingDto,
  SettingQueryDto,
  SettingResponse,
} from './app-setting.types';

@Injectable()
export class AppSettingService {
  constructor(
    private readonly settingRepository: AppSettingRepository,
    private readonly auditService: AuditService,
    private readonly cacheService: CacheService,
  ) {}

  private toResponse(s: any): SettingResponse {
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

  async findAll(query: SettingQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
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

  async findByKey(key: string): Promise<SettingResponse> {
    const setting = await this.settingRepository.findByKey(key);
    if (!setting)
      throw new BusinessException('Setting not found', 'SETTING_001');
    return this.toResponse(setting);
  }

  async create(
    dto: CreateSettingDto,
    userId: string,
  ): Promise<SettingResponse> {
    const existing = await this.settingRepository.findByKey(dto.key);
    if (existing)
      throw new BusinessException('Setting key already exists', 'SETTING_002');
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
    // storefront-public.service.ts caches the public settings payload under
    // this exact key for 5 minutes — without busting it here, admin's save
    // silently has no visible effect on the live site until the cache
    // naturally expires.
    await this.cacheService.del('storefront:settings');
    return this.toResponse(setting);
  }

  async update(
    id: string,
    dto: UpdateSettingDto,
    userId: string,
  ): Promise<SettingResponse> {
    const setting = await this.settingRepository.findById(id);
    if (!setting)
      throw new BusinessException('Setting not found', 'SETTING_001');
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
    // See create() above — same cache, same reason.
    await this.cacheService.del('storefront:settings');
    return this.toResponse(updated);
  }

  async getByKey(key: string, defaultValue?: string): Promise<string | null> {
    const value = await this.settingRepository.getByKey(key);
    return value ?? defaultValue ?? null;
  }

  async getPublicSettingsFallback() {
    const [
      autoplaySetting,
      enabledSetting,
      mobileAnnouncementSetting,
      announcementTextSetting,
      announcementEnabledSetting,
      announcementLinkSetting,
      announcementLinkTextSetting,
      announcementBgColorSetting,
      announcementTextColorSetting,
    ] = await Promise.all([
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
    const announcementBgColor = announcementBgColorSetting ? announcementBgColorSetting.value : '#800020';
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
}
