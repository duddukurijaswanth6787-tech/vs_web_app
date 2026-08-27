import { ConfigService } from '@nestjs/config';
import { AppSettingRepository } from "../../app-setting/app-setting.repository";
import { AuditService } from "../../audit/audit.service";
import { SessionExpirySettingsResponse as SessionExpirySettings, UpdateSessionExpirySettingsDto } from './session-settings.types';
export declare class SessionSettingsService {
    private readonly configService;
    private readonly settingRepository;
    private readonly auditService;
    constructor(configService: ConfigService, settingRepository: AppSettingRepository, auditService: AuditService);
    private getInt;
    getSettings(): Promise<SessionExpirySettings>;
    updateSettings(dto: UpdateSessionExpirySettingsDto, userId: string): Promise<SessionExpirySettings>;
}
