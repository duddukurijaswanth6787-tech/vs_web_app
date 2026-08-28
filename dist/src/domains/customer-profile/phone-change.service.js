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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoneChangeService = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("../../common/exceptions");
const prisma_service_1 = require("../../database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const otp_service_1 = require("../otp/otp.service");
const PHONE_CHANGE_PURPOSE = 'PHONE_CHANGE';
let PhoneChangeService = class PhoneChangeService {
    prisma;
    otpService;
    auditService;
    constructor(prisma, otpService, auditService) {
        this.prisma = prisma;
        this.otpService = otpService;
        this.auditService = auditService;
    }
    async assertPhoneAvailable(phone, userId) {
        const owner = await this.prisma.user.findFirst({
            where: { phone, deletedAt: null },
            select: { id: true },
        });
        if (owner && owner.id !== userId) {
            throw new exceptions_1.BusinessException('This phone number is already registered to another account', 'PHONE_TAKEN');
        }
    }
    async requestChange(userId, phone) {
        await this.assertPhoneAvailable(phone, userId);
        const result = await this.otpService.sendOtp({
            phone,
            purpose: PHONE_CHANGE_PURPOSE,
        });
        await this.auditService.log({
            action: 'PHONE_CHANGE_REQUESTED',
            module: 'customer-profile',
            resource: 'user',
            resourceId: userId,
            userId,
            newValue: { phone },
        });
        return result;
    }
    async confirmChange(userId, phone, code) {
        await this.assertPhoneAvailable(phone, userId);
        const { verified } = await this.otpService.verifyOtp({
            phone,
            code,
            purpose: PHONE_CHANGE_PURPOSE,
        });
        if (!verified) {
            throw new exceptions_1.BusinessException('Incorrect verification code', 'OTP_003');
        }
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: userId },
                data: { phone, isPhoneVerified: true },
            }),
            this.prisma.customerProfile.updateMany({
                where: { userId },
                data: { phone },
            }),
        ]);
        await this.auditService.log({
            action: 'PHONE_CHANGE_CONFIRMED',
            module: 'customer-profile',
            resource: 'user',
            resourceId: userId,
            userId,
            newValue: { phone },
        });
        return { phone, verified: true };
    }
};
exports.PhoneChangeService = PhoneChangeService;
exports.PhoneChangeService = PhoneChangeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        otp_service_1.OtpService,
        audit_service_1.AuditService])
], PhoneChangeService);
//# sourceMappingURL=phone-change.service.js.map