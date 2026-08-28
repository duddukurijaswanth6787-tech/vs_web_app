import { AppSettingService } from './app-setting.service';
import { CreateSettingDto, UpdateSettingDto, SettingQueryDto } from './app-setting.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class AppSettingController {
    private readonly settingService;
    constructor(settingService: AppSettingService);
    findAll(query: SettingQueryDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        data: import("./app-setting.types").SettingResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    getPublic(): Promise<import("../../common/responses/response.builder").ResponsePayload<{
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
    }>>;
    findByKey(key: string): Promise<import("../../common/responses/response.builder").ResponsePayload<{
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
    }> | import("../../common/responses/response.builder").ResponsePayload<import("./app-setting.types").SettingResponse>>;
    create(dto: CreateSettingDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./app-setting.types").SettingResponse>>;
    update(id: string, dto: UpdateSettingDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./app-setting.types").SettingResponse>>;
}
