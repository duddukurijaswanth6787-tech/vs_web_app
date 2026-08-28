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
var OtpGatewayService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpGatewayService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const app_setting_repository_1 = require("../app-setting/app-setting.repository");
const identity_constants_1 = require("../../shared/identity/identity.constants");
const GROUP = 'otp_gateway';
const KEYS = {
    provider: 'otp_gateway.provider',
    appName: 'otp_gateway.app_name',
    templateLogin: 'otp_gateway.template_login',
    templateRegister: 'otp_gateway.template_register',
    templateVerifyPhone: 'otp_gateway.template_verify_phone',
    templateOrderConfirmed: 'otp_gateway.template_order_confirmed',
    expiryMinutes: 'otp_gateway.expiry_minutes',
    apiKey: 'otp_gateway.api_key',
};
let OtpGatewayService = OtpGatewayService_1 = class OtpGatewayService {
    prisma;
    configService;
    auditService;
    settingRepository;
    logger = new common_1.Logger(OtpGatewayService_1.name);
    constructor(prisma, configService, auditService, settingRepository) {
        this.prisma = prisma;
        this.configService = configService;
        this.auditService = auditService;
        this.settingRepository = settingRepository;
    }
    async upsert(key, value, description) {
        const existing = await this.settingRepository.findByKey(key);
        if (existing) {
            await this.settingRepository.update(existing.id, { value });
        }
        else {
            await this.settingRepository.create({ key, value, group: GROUP, description });
        }
    }
    async getEffectiveApiKey() {
        const dbKey = await this.settingRepository.getByKey(KEYS.apiKey);
        return dbKey || this.configService.get('app.startMessaging.apiKey', '');
    }
    async getExpiryMinutes() {
        const raw = await this.settingRepository.getByKey(KEYS.expiryMinutes);
        const parsed = raw ? parseInt(raw, 10) : NaN;
        return Number.isFinite(parsed) && parsed > 0 ? parsed : identity_constants_1.IDENTITY_CONSTANTS.OTP_EXPIRY_MINUTES;
    }
    async getConfig() {
        const [provider, appName, templateLogin, templateRegister, templateVerifyPhone, templateOrderConfirmed, expiryMinutes, apiKey,] = await Promise.all([
            this.settingRepository.getByKey(KEYS.provider),
            this.settingRepository.getByKey(KEYS.appName),
            this.settingRepository.getByKey(KEYS.templateLogin),
            this.settingRepository.getByKey(KEYS.templateRegister),
            this.settingRepository.getByKey(KEYS.templateVerifyPhone),
            this.settingRepository.getByKey(KEYS.templateOrderConfirmed),
            this.getExpiryMinutes(),
            this.getEffectiveApiKey(),
        ]);
        return {
            provider: provider || 'mock',
            appName: appName || "Vasanthi's Signature",
            templateLogin: templateLogin || '',
            templateRegister: templateRegister || '',
            templateVerifyPhone: templateVerifyPhone || '',
            templateOrderConfirmed: templateOrderConfirmed || '',
            expiryMinutes,
            apiKeyConfigured: !!apiKey,
        };
    }
    async updateConfig(dto, userId) {
        const updates = [
            [KEYS.provider, dto.provider, 'OTP gateway provider (mock or startmessaging)'],
            [KEYS.appName, dto.appName, 'App name substituted into {{appName}} in OTP templates'],
            [KEYS.templateLogin, dto.templateLogin, 'StartMessaging template ID for LOGIN OTPs'],
            [KEYS.templateRegister, dto.templateRegister, 'StartMessaging template ID for REGISTER OTPs'],
            [
                KEYS.templateVerifyPhone,
                dto.templateVerifyPhone,
                'StartMessaging template ID for VERIFY_PHONE OTPs',
            ],
            [
                KEYS.templateOrderConfirmed,
                dto.templateOrderConfirmed,
                'StartMessaging template ID for order-confirmed SMS',
            ],
        ];
        for (const [key, value, description] of updates) {
            if (value === undefined)
                continue;
            await this.upsert(key, value, description);
        }
        if (dto.expiryMinutes !== undefined) {
            await this.upsert(KEYS.expiryMinutes, String(dto.expiryMinutes), 'OTP validity window in minutes (also used as {{expiry}} in templates)');
        }
        if (dto.apiKey !== undefined) {
            await this.upsert(KEYS.apiKey, dto.apiKey, 'StartMessaging API key (secret)');
        }
        await this.auditService.log({
            action: 'OTP_GATEWAY_CONFIG_UPDATED',
            module: 'otp-gateway',
            resource: 'app_setting',
            userId,
            newValue: { ...dto, apiKey: dto.apiKey !== undefined ? '[redacted]' : undefined },
        });
        return this.getConfig();
    }
    async sendTemplateMessage(params) {
        const { config, phone, templateId, variables, logTemplate, logMessage, missingTemplateNote, userId } = params;
        const log = await this.prisma.smsLog.create({
            data: { userId, phone, template: logTemplate, message: logMessage, status: 'PENDING' },
        });
        if (config.provider !== 'startmessaging' || !config.apiKeyConfigured) {
            await this.prisma.smsLog.update({
                where: { id: log.id },
                data: {
                    status: 'MOCK_SENT',
                    providerRef: `mock_${log.id.slice(0, 8)}`,
                    metadata: {
                        note: config.provider === 'startmessaging'
                            ? 'StartMessaging selected but STARTMESSAGING_API_KEY is not set; mocked as sent.'
                            : 'OTP gateway set to mock; mocked as sent.',
                    },
                },
            });
            return;
        }
        if (!templateId) {
            await this.prisma.smsLog.update({
                where: { id: log.id },
                data: { status: 'FAILED', error: missingTemplateNote },
            });
            this.logger.error(missingTemplateNote);
            return;
        }
        try {
            const baseUrl = this.configService.get('app.startMessaging.baseUrl');
            const apiKey = await this.getEffectiveApiKey();
            const res = await fetch(`${baseUrl}/otp/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
                body: JSON.stringify({
                    phoneNumber: phone.startsWith('+') ? phone : `+91${phone}`,
                    templateId,
                    variables,
                }),
            });
            const body = await res.json().catch(() => ({}));
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
        }
        catch (err) {
            this.logger.error(`StartMessaging send failed: ${err?.message}`);
            await this.prisma.smsLog.update({
                where: { id: log.id },
                data: { status: 'FAILED', error: err?.message ?? 'StartMessaging send failed' },
            });
        }
    }
    async sendOtp(params) {
        const { phone, code, purpose, expiryMinutes, userId } = params;
        const config = await this.getConfig();
        const templateId = purpose === 'REGISTER'
            ? config.templateRegister
            : purpose === 'VERIFY_PHONE'
                ? config.templateVerifyPhone
                : config.templateLogin;
        await this.sendTemplateMessage({
            config,
            phone,
            templateId,
            variables: { otp: code, appName: config.appName, expiry: String(expiryMinutes) },
            logTemplate: `OTP_${purpose}`,
            logMessage: `OTP ${code} (${purpose})`,
            missingTemplateNote: `No StartMessaging template configured for purpose ${purpose}`,
            userId,
        });
    }
    async sendOrderConfirmedSms(params) {
        const { phone, orderNumber, userId } = params;
        const config = await this.getConfig();
        await this.sendTemplateMessage({
            config,
            phone,
            templateId: config.templateOrderConfirmed,
            variables: { otp: orderNumber, orderNumber, appName: config.appName },
            logTemplate: 'ORDER_CONFIRMED',
            logMessage: `Order ${orderNumber} confirmed`,
            missingTemplateNote: 'No StartMessaging template configured for order confirmation',
            userId,
        });
    }
};
exports.OtpGatewayService = OtpGatewayService;
exports.OtpGatewayService = OtpGatewayService = OtpGatewayService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        audit_service_1.AuditService,
        app_setting_repository_1.AppSettingRepository])
], OtpGatewayService);
//# sourceMappingURL=otp-gateway.service.js.map