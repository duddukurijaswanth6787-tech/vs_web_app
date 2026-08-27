"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
const prisma_service_1 = require("../../database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const STORE_NAME = "Vasanthi's Signature";
const STORE_ADDRESS = 'Road No. 12, Banjara Hills, Hyderabad - 500034';
const STORE_PHONE = '+91 98765 43210';
let EmailService = EmailService_1 = class EmailService {
    prisma;
    configService;
    auditService;
    logger = new common_1.Logger(EmailService_1.name);
    transporter = null;
    constructor(prisma, configService, auditService) {
        this.prisma = prisma;
        this.configService = configService;
        this.auditService = auditService;
    }
    isEnabled() {
        return this.configService.get('app.features.email', false);
    }
    getTransporter() {
        if (this.transporter)
            return this.transporter;
        const host = this.configService.get('app.email.smtpHost', '');
        const port = this.configService.get('app.email.smtpPort', 587);
        const secure = this.configService.get('app.email.smtpSecure', false);
        const user = this.configService.get('app.email.smtpUser', '');
        const pass = this.configService.get('app.email.smtpPassword', '');
        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: user ? { user, pass } : undefined,
        });
        return this.transporter;
    }
    fromHeader() {
        const name = this.configService.get('app.email.fromName', STORE_NAME);
        const address = this.configService.get('app.email.fromAddress', 'no-reply@vsboutique.shop');
        return `"${name}" <${address}>`;
    }
    async send(dto, actorId) {
        const log = await this.prisma.emailLog.create({
            data: {
                userId: dto.userId,
                toEmail: dto.to,
                template: dto.template,
                subject: dto.subject,
                status: 'PENDING',
            },
        });
        if (!this.isEnabled()) {
            const updated = await this.prisma.emailLog.update({
                where: { id: log.id },
                data: {
                    status: 'MOCK_SENT',
                    providerRef: `mock_${log.id.slice(0, 8)}`,
                    metadata: {
                        note: 'Email disabled; mocked as sent. Set ENABLE_EMAIL=true and SMTP_HOST/SMTP_USER/SMTP_PASSWORD for live send.',
                    },
                },
            });
            this.logger.warn(`Email mocked (disabled): ${dto.to} / ${dto.template}`);
            return updated;
        }
        try {
            const info = await this.getTransporter().sendMail({
                from: this.fromHeader(),
                to: dto.to,
                subject: dto.subject,
                html: dto.html,
            });
            const updated = await this.prisma.emailLog.update({
                where: { id: log.id },
                data: { status: 'SENT', providerRef: info.messageId },
            });
            await this.auditService.log({
                action: 'EMAIL_SENT',
                module: 'email',
                resource: 'email_log',
                resourceId: updated.id,
                userId: actorId,
                newValue: { to: dto.to, template: dto.template },
            });
            return updated;
        }
        catch (err) {
            this.logger.error(`Email send failed: ${dto.to} / ${dto.template}`, err?.stack);
            return this.prisma.emailLog.update({
                where: { id: log.id },
                data: { status: 'FAILED', error: err?.message ?? 'Email send failed' },
            });
        }
    }
    layout(bodyHtml) {
        const logoUrl = `${this.configService.get('app.frontendUrl')}/brand/logo-icon.png`;
        return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#faf7f5;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #f0e4e8;">
        <tr><td style="background:#0284c7;padding:24px;text-align:center;">
          <img src="${logoUrl}" alt="${STORE_NAME}" width="48" height="48" style="border-radius:8px;" />
          <div style="color:#fbe4ea;font-size:12px;letter-spacing:1px;margin-top:8px;">${STORE_NAME.toUpperCase()}</div>
        </td></tr>
        <tr><td style="padding:28px 24px;color:#292524;font-size:14px;line-height:1.6;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:16px 24px;background:#fafaf9;border-top:1px solid #f0e4e8;color:#a8a29e;font-size:11px;text-align:center;">
          ${STORE_ADDRESS}<br/>${STORE_PHONE}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
    }
    async sendPasswordResetEmail(to, resetUrl, userId) {
        const html = this.layout(`
      <h2 style="margin:0 0 12px;color:#0284c7;font-size:18px;">Reset your password</h2>
      <p>We received a request to reset the password on your account. This link expires in 15 minutes.</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${resetUrl}" style="background:#0284c7;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:13px;display:inline-block;">Reset Password</a>
      </p>
      <p style="color:#78716c;font-size:12px;">If you didn't request this, you can safely ignore this email -- your password won't change.</p>
    `);
        return this.send({ to, template: 'PASSWORD_RESET', subject: `${STORE_NAME}: Reset your password`, html, userId });
    }
    async sendWelcomeEmail(to, firstName, userId) {
        const html = this.layout(`
      <h2 style="margin:0 0 12px;color:#0284c7;font-size:18px;">Welcome${firstName ? `, ${firstName}` : ''}!</h2>
      <p>Thank you for creating an account with ${STORE_NAME}. Explore our latest sarees, lehengas and designer wear online.</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${this.configService.get('app.frontendUrl')}" style="background:#0284c7;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:13px;display:inline-block;">Start Shopping</a>
      </p>
    `);
        return this.send({ to, template: 'WELCOME', subject: `Welcome to ${STORE_NAME}`, html, userId });
    }
    async sendOrderConfirmationEmail(params) {
        const itemRows = params.items
            .map((i) => `
      <tr>
        <td style="padding:6px 0;border-bottom:1px solid #f5f5f4;">${i.productName}${i.variantTitle ? ` <span style="color:#a8a29e;">(${i.variantTitle})</span>` : ''}</td>
        <td style="padding:6px 0;border-bottom:1px solid #f5f5f4;text-align:center;">x${i.quantity}</td>
        <td style="padding:6px 0;border-bottom:1px solid #f5f5f4;text-align:right;">₹${(i.unitPrice * i.quantity).toFixed(2)}</td>
      </tr>`)
            .join('');
        const trackUrl = `${this.configService.get('app.frontendUrl')}/orders/track/${encodeURIComponent(params.orderNumber)}`;
        const html = this.layout(`
      <h2 style="margin:0 0 4px;color:#0284c7;font-size:18px;">Order confirmed!</h2>
      <p style="margin:0 0 16px;color:#78716c;">Order #${params.orderNumber}</p>
      <table role="presentation" width="100%" style="font-size:13px;border-collapse:collapse;">
        <thead><tr>
          <th style="text-align:left;border-bottom:1px solid #e7e5e4;padding-bottom:6px;">Item</th>
          <th style="text-align:center;border-bottom:1px solid #e7e5e4;padding-bottom:6px;">Qty</th>
          <th style="text-align:right;border-bottom:1px solid #e7e5e4;padding-bottom:6px;">Total</th>
        </tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <table role="presentation" width="100%" style="font-size:13px;margin-top:12px;">
        <tr><td>Subtotal</td><td style="text-align:right;">₹${params.subtotal.toFixed(2)}</td></tr>
        ${params.discountTotal ? `<tr><td>Discount</td><td style="text-align:right;color:#15803d;">-₹${params.discountTotal.toFixed(2)}</td></tr>` : ''}
        ${params.taxTotal ? `<tr><td>Tax</td><td style="text-align:right;">₹${params.taxTotal.toFixed(2)}</td></tr>` : ''}
        <tr><td>Shipping</td><td style="text-align:right;">${params.shippingCharge ? `₹${params.shippingCharge.toFixed(2)}` : 'FREE'}</td></tr>
        <tr><td style="font-weight:bold;padding-top:6px;border-top:1px solid #e7e5e4;">Total</td><td style="text-align:right;font-weight:bold;color:#0284c7;padding-top:6px;border-top:1px solid #e7e5e4;">₹${params.grandTotal.toFixed(2)}</td></tr>
      </table>
      <p style="text-align:center;margin:24px 0 0;">
        <a href="${trackUrl}" style="background:#0284c7;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:13px;display:inline-block;">Track Your Order</a>
      </p>
    `);
        return this.send({
            to: params.to,
            template: 'ORDER_CONFIRMED',
            subject: `${STORE_NAME}: Order #${params.orderNumber} confirmed`,
            html,
            userId: params.userId,
        });
    }
    async listLogs(page = 1, limit = 20) {
        const take = Math.min(limit, 100);
        const [data, total] = await Promise.all([
            this.prisma.emailLog.findMany({
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * take,
                take,
            }),
            this.prisma.emailLog.count(),
        ]);
        return { data, meta: { page, limit: take, total } };
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        audit_service_1.AuditService])
], EmailService);
//# sourceMappingURL=email.service.js.map