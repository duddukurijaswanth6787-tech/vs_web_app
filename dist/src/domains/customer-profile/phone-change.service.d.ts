import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { OtpService } from "../otp/otp.service";
export declare class PhoneChangeService {
    private readonly prisma;
    private readonly otpService;
    private readonly auditService;
    constructor(prisma: PrismaService, otpService: OtpService, auditService: AuditService);
    private assertPhoneAvailable;
    requestChange(userId: string, phone: string): Promise<import("../otp/otp.types").SendOtpResponse>;
    confirmChange(userId: string, phone: string, code: string): Promise<{
        phone: string;
        verified: boolean;
    }>;
}
