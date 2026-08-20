import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@database/prisma.service';
import { AuditService } from '@domains/audit/audit.service';
import { AppSettingRepository } from '@domains/app-setting/app-setting.repository';
import { IDENTITY_CONSTANTS } from '@shared/identity/identity.constants';
import {
  OtpGatewayConfigResponse,
  OtpGatewayProvider,
  UpdateOtpGatewayConfigDto,
} from './otp-gateway.types';

const GROUP = 'otp_gateway';
const KEYS = {
  provider: 'otp_gateway.provider',
  appName: 'otp_gateway.app_name',
  templateLogin: 'otp_gateway.template_login',
  templateRegister: 'otp_gateway.template_register',
  templateVerifyPhone: 'otp_gateway.template_verify_phone',
  expiryMinutes: 'otp_gateway.expiry_minutes',
  apiKey: 'otp_gateway.api_key',
};

/**
 * Admin-configurable OTP delivery: which gateway to use, which StartMessaging
 * template ID applies to each purpose, and the API key itself. Settings are
 * stored as AppSetting rows (group "otp_gateway") so the admin UI can manage
 * them without a redeploy. The API key is write-only -- accepted by
 * updateConfig(), used internally by sendOtp(), but never included in
 * getConfig()'s response (only whether one is set). A DB-stored key takes
 * priority over the STARTMESSAGING_API_KEY env var if both are present, so
 * either the admin UI or Railway variables can be used to set it.
 */
@Injectable()
export class OtpGatewayService {
  private readonly logger = new Logger(OtpGatewayService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly settingRepository: AppSettingRepository,
  ) {}

  private async upsert(key: string, value: string, description: string) {
    const existing = await this.settingRepository.findByKey(key);
    if (existing) {
      await this.settingRepository.update(existing.id, { value });
    } else {
      await this.settingRepository.create({ key, value, group: GROUP, description });
    }
  }

  /** DB-stored key wins over the env var if both are present. */
  private async getEffectiveApiKey(): Promise<string> {
    const dbKey = await this.settingRepository.getByKey(KEYS.apiKey);
    return dbKey || this.configService.get<string>('app.startMessaging.apiKey', '');
  }

  /** Admin-configured OTP validity window, falling back to the identity default. */
  async getExpiryMinutes(): Promise<number> {
    const raw = await this.settingRepository.getByKey(KEYS.expiryMinutes);
    const parsed = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : IDENTITY_CONSTANTS.OTP_EXPIRY_MINUTES;
  }

  async getConfig(): Promise<OtpGatewayConfigResponse> {
    const [provider, appName, templateLogin, templateRegister, templateVerifyPhone, expiryMinutes, apiKey] =
      await Promise.all([
        this.settingRepository.getByKey(KEYS.provider),
        this.settingRepository.getByKey(KEYS.appName),
        this.settingRepository.getByKey(KEYS.templateLogin),
        this.settingRepository.getByKey(KEYS.templateRegister),
        this.settingRepository.getByKey(KEYS.templateVerifyPhone),
        this.getExpiryMinutes(),
        this.getEffectiveApiKey(),
      ]);
    return {
      provider: (provider as OtpGatewayProvider) || 'mock',
      appName: appName || "Vasanthi's Signature",
      templateLogin: templateLogin || '',
      templateRegister: templateRegister || '',
      templateVerifyPhone: templateVerifyPhone || '',
      expiryMinutes,
      apiKeyConfigured: !!apiKey,
    };
  }

  async updateConfig(
    dto: UpdateOtpGatewayConfigDto,
    userId: string,
  ): Promise<OtpGatewayConfigResponse> {
    const updates: Array<[string, string | undefined, string]> = [
      [KEYS.provider, dto.provider, 'OTP gateway provider (mock or startmessaging)'],
      [KEYS.appName, dto.appName, 'App name substituted into {{appName}} in OTP templates'],
      [KEYS.templateLogin, dto.templateLogin, 'StartMessaging template ID for LOGIN OTPs'],
      [KEYS.templateRegister, dto.templateRegister, 'StartMessaging template ID for REGISTER OTPs'],
      [
        KEYS.templateVerifyPhone,
        dto.templateVerifyPhone,
        'StartMessaging template ID for VERIFY_PHONE OTPs',
      ],
    ];
    for (const [key, value, description] of updates) {
      if (value === undefined) continue;
      await this.upsert(key, value, description);
    }
    if (dto.expiryMinutes !== undefined) {
      await this.upsert(
        KEYS.expiryMinutes,
        String(dto.expiryMinutes),
        'OTP validity window in minutes (also used as {{expiry}} in templates)',
      );
    }
    if (dto.apiKey !== undefined) {
      await this.upsert(KEYS.apiKey, dto.apiKey, 'StartMessaging API key (secret)');
    }
    await this.auditService.log({
      action: 'OTP_GATEWAY_CONFIG_UPDATED',
      module: 'otp-gateway',
      resource: 'app_setting',
      userId,
      // Never audit-log the key itself -- just whether it changed.
      newValue: { ...dto, apiKey: dto.apiKey !== undefined ? '[redacted]' : undefined },
    });
    return this.getConfig();
  }

  /**
   * Sends the OTP through the admin-configured gateway, logging every
   * attempt to SmsLog (same audit trail SmsService uses) regardless of
   * outcome. Never throws -- OTP login must not break because the SMS
   * provider is briefly down; the code the caller generated is still
   * valid either way, the user just needs to check for it or resend.
   */
  async sendOtp(params: {
    phone: string;
    code: string;
    purpose: string;
    expiryMinutes: number;
    userId?: string;
  }): Promise<void> {
    const { phone, code, purpose, expiryMinutes, userId } = params;
    const config = await this.getConfig();
    const log = await this.prisma.smsLog.create({
      data: {
        userId,
        phone,
        template: `OTP_${purpose}`,
        message: `OTP ${code} (${purpose})`,
        status: 'PENDING',
      },
    });

    if (config.provider !== 'startmessaging' || !config.apiKeyConfigured) {
      await this.prisma.smsLog.update({
        where: { id: log.id },
        data: {
          status: 'MOCK_SENT',
          providerRef: `mock_${log.id.slice(0, 8)}`,
          metadata: {
            note:
              config.provider === 'startmessaging'
                ? 'StartMessaging selected but STARTMESSAGING_API_KEY is not set; mocked as sent.'
                : 'OTP gateway set to mock; mocked as sent.',
          },
        },
      });
      return;
    }

    const templateId =
      purpose === 'REGISTER'
        ? config.templateRegister
        : purpose === 'VERIFY_PHONE'
          ? config.templateVerifyPhone
          : config.templateLogin;

    if (!templateId) {
      await this.prisma.smsLog.update({
        where: { id: log.id },
        data: {
          status: 'FAILED',
          error: `No StartMessaging template configured for purpose ${purpose}`,
        },
      });
      this.logger.error(`No StartMessaging template configured for purpose ${purpose}`);
      return;
    }

    try {
      const baseUrl = this.configService.get<string>('app.startMessaging.baseUrl');
      const apiKey = await this.getEffectiveApiKey();
      const res = await fetch(`${baseUrl}/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
        body: JSON.stringify({
          phoneNumber: phone.startsWith('+') ? phone : `+91${phone}`,
          templateId,
          variables: { otp: code, appName: config.appName, expiry: String(expiryMinutes) },
        }),
      });
      const body: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.message || `StartMessaging responded ${res.status}`);
      }
      await this.prisma.smsLog.update({
        where: { id: log.id },
        data: {
          status: 'SENT',
          providerRef: body?.id ? String(body.id) : `startmessaging_${Date.now()}`,
        },
      });
    } catch (err: any) {
      this.logger.error(`StartMessaging OTP send failed: ${err?.message}`);
      await this.prisma.smsLog.update({
        where: { id: log.id },
        data: { status: 'FAILED', error: err?.message ?? 'StartMessaging send failed' },
      });
    }
  }
}
