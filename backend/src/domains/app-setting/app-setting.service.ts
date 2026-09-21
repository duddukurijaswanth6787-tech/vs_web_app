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
      shippingFeeEnabledSetting,
      shippingFlatFeeSetting,
      shippingFreeThresholdEnabledSetting,
      shippingFreeThresholdSetting,
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
      this.settingRepository.findByKey('shipping_fee_enabled'),
      this.settingRepository.findByKey('shipping_flat_fee'),
      this.settingRepository.findByKey('shipping_free_threshold_enabled'),
      this.settingRepository.findByKey('shipping_free_threshold'),
    ]);
    const announcementText = announcementTextSetting
      ? announcementTextSetting.value
      : 'Festive Sale is Live! Get up to 30% OFF';
    const mobileEnabled = mobileAnnouncementSetting
      ? mobileAnnouncementSetting.value === 'true'
      : true;
    const autoplayInterval = autoplaySetting
      ? parseInt(autoplaySetting.value, 10)
      : 5;
    const autoplayEnabled = enabledSetting
      ? enabledSetting.value === 'true'
      : true;
    const announcementEnabled = announcementEnabledSetting
      ? announcementEnabledSetting.value === 'true'
      : true;
    const announcementLink = announcementLinkSetting
      ? announcementLinkSetting.value
      : '/offers';
    const announcementLinkText = announcementLinkTextSetting
      ? announcementLinkTextSetting.value
      : 'Shop Now →';
    const announcementBgColor = announcementBgColorSetting
      ? announcementBgColorSetting.value
      : '#0284c7';
    const announcementTextColor = announcementTextColorSetting
      ? announcementTextColorSetting.value
      : '#FFFFFF';

    const shippingFeeEnabled = shippingFeeEnabledSetting
      ? shippingFeeEnabledSetting.value === 'true'
      : false;
    const shippingFlatFee = shippingFlatFeeSetting
      ? parseFloat(shippingFlatFeeSetting.value) || 0
      : 0;
    const shippingFreeThresholdEnabled = shippingFreeThresholdEnabledSetting
      ? shippingFreeThresholdEnabledSetting.value === 'true'
      : false;
    const shippingFreeThreshold = shippingFreeThresholdSetting
      ? parseFloat(shippingFreeThresholdSetting.value) || 0
      : 0;

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
      shippingFeeEnabled,
      shippingFlatFee,
      shippingFreeThresholdEnabled,
      shippingFreeThreshold,
      shipping_fee_enabled: shippingFeeEnabled ? 'true' : 'false',
      shipping_flat_fee: String(shippingFlatFee),
      shipping_free_threshold_enabled: shippingFreeThresholdEnabled ? 'true' : 'false',
      shipping_free_threshold: String(shippingFreeThreshold),
    };
  }
}
