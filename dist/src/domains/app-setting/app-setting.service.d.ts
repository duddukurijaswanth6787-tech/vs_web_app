import { AuditService } from "../audit/audit.service";
import { CacheService } from "../../infrastructure/redis";
import { AppSettingRepository } from './app-setting.repository';
import { CreateSettingDto, UpdateSettingDto, SettingQueryDto, SettingResponse } from './app-setting.types';
export declare class AppSettingService {
    private readonly settingRepository;
    private readonly auditService;
    private readonly cacheService;
    constructor(settingRepository: AppSettingRepository, auditService: AuditService, cacheService: CacheService);
    private toResponse;
    findAll(query: SettingQueryDto): Promise<{
        data: SettingResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findByKey(key: string): Promise<SettingResponse>;
    create(dto: CreateSettingDto, userId: string): Promise<SettingResponse>;
    update(id: string, dto: UpdateSettingDto, userId: string): Promise<SettingResponse>;
    getByKey(key: string, defaultValue?: string): Promise<string | null>;
    getPublicSettingsFallback(): Promise<{
        bannerAutoplayInterval: number;
        bannerAutoplayEnabled: boolean;
        announcementBarEnabled: boolean;
        announcementBarMobileEnabled: boolean;
        announcementBarText: string;
        announcementBarLink: string;
        announcementBarLinkText: string;
        announcementBarBgColor: string;
        announcementBarTextColor: string;
        announcement_bar_enabled: boolean;
        announcement_bar_text: string;
        announcement_bar_mobile_enabled: boolean;
        announcement_bar_link: string;
        announcement_bar_link_text: string;
        announcement_bar_bg_color: string;
        announcement_bar_text_color: string;
        banner_autoplay_interval: number;
        banner_autoplay_enabled: boolean;
    }>;
}
