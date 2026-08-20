import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppSettingRepository } from '@domains/app-setting/app-setting.repository';
import { AuditService } from '@domains/audit/audit.service';
import {
  SessionExpirySettingsResponse as SessionExpirySettings,
  UpdateSessionExpirySettingsDto,
} from './session-settings.types';

const GROUP = 'session_settings';
const KEYS = {
  accessTokenMinutes: 'session.access_token_minutes',
  rememberMeAccessTokenDays: 'session.remember_me_access_token_days',
  refreshTokenDays: 'session.refresh_token_days',
  rememberMeRefreshTokenDays: 'session.remember_me_refresh_token_days',
};

/**
 * How long login tokens stay valid, admin-configurable at runtime instead of
 * a redeploy-only env var. Backs JwtService (access token) and
 * RefreshTokenService (refresh token / session length). Falls back to the
 * existing env-var defaults whenever no DB override has been set, so an
 * un-configured deploy behaves exactly as it did before this existed.
 */
@Injectable()
export class SessionSettingsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly settingRepository: AppSettingRepository,
    private readonly auditService: AuditService,
  ) {}

  private async getInt(key: string, fallback: number): Promise<number> {
    const raw = await this.settingRepository.getByKey(key);
    const parsed = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  async getSettings(): Promise<SessionExpirySettings> {
    const [accessTokenMinutes, rememberMeAccessTokenDays, refreshTokenDays, rememberMeRefreshTokenDays] =
      await Promise.all([
        this.getInt(
          KEYS.accessTokenMinutes,
          Math.round(this.configService.get<number>('app.jwt.expiresIn', 900) / 60),
        ),
        this.getInt(
          KEYS.rememberMeAccessTokenDays,
          Math.round(this.configService.get<number>('app.jwt.rememberMeExpiresIn', 2592000) / 86400),
        ),
        this.getInt(KEYS.refreshTokenDays, this.configService.get<number>('app.jwt.refreshTokenExpiryDays', 7)),
        this.getInt(KEYS.rememberMeRefreshTokenDays, 30),
      ]);
    return { accessTokenMinutes, rememberMeAccessTokenDays, refreshTokenDays, rememberMeRefreshTokenDays };
  }

  async updateSettings(
    dto: UpdateSessionExpirySettingsDto,
    userId: string,
  ): Promise<SessionExpirySettings> {
    const updates: Array<[string, number | undefined, string]> = [
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
      if (value === undefined) continue;
      const existing = await this.settingRepository.findByKey(key);
      if (existing) {
        await this.settingRepository.update(existing.id, { value: String(value) });
      } else {
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
}
