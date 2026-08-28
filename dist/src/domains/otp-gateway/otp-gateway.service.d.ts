import { ConfigService } from '@nestjs/config';
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AppSettingRepository } from "../app-setting/app-setting.repository";
import { OtpGatewayConfigResponse, UpdateOtpGatewayConfigDto } from './otp-gateway.types';
export declare class OtpGatewayService {
    private readonly prisma;
    private readonly configService;
    private readonly auditService;
    private readonly settingRepository;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService, auditService: AuditService, settingRepository: AppSettingRepository);
    private upsert;
    private getEffectiveApiKey;
    getExpiryMinutes(): Promise<number>;
    getConfig(): Promise<OtpGatewayConfigResponse>;
    updateConfig(dto: UpdateOtpGatewayConfigDto, userId: string): Promise<OtpGatewayConfigResponse>;
    private sendTemplateMessage;
    sendOtp(params: {
        phone: string;
        code: string;
        purpose: string;
        expiryMinutes: number;
        userId?: string;
    }): Promise<void>;
    sendOrderConfirmedSms(params: {
        phone: string;
        orderNumber: string;
        userId?: string;
    }): Promise<void>;
}
