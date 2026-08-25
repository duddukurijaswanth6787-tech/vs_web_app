import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '@database/prisma.service';
import { AuditService } from '@domains/audit/audit.service';
import { SendEmailDto } from './email.types';

const STORE_NAME = "Vasanthi's Signature";
const STORE_ADDRESS = 'Road No. 12, Banjara Hills, Hyderabad - 500034';
const STORE_PHONE = '+91 98765 43210';

/**
 * Real SMTP email sending -- follows the exact pattern already established
 * by SmsService (backend/src/domains/sms/sms.service.ts): every attempt is
 * logged to the DB regardless of outcome, sending is fully mocked (no
 * network call) unless ENABLE_EMAIL=true, and a real provider requires
 * SMTP_HOST/SMTP_USER/SMTP_PASSWORD to be set. Uses Nodemailer over plain
 * SMTP rather than a specific vendor SDK (SendGrid/SES/etc) so it works
 * with any SMTP-compatible provider -- Gmail, Zoho, Amazon SES's SMTP
 * interface, SendGrid's SMTP relay, or a self-hosted relay -- without
 * requiring a specific paid service to be chosen up front.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  private isEnabled(): boolean {
    return this.configService.get<boolean>('app.features.email', false);
  }

  private getTransporter(): nodemailer.Transporter {
    if (this.transporter) return this.transporter;
    const host = this.configService.get<string>('app.email.smtpHost', '');
    const port = this.configService.get<number>('app.email.smtpPort', 587);
    const secure = this.configService.get<boolean>('app.email.smtpSecure', false);
    const user = this.configService.get<string>('app.email.smtpUser', '');
    const pass = this.configService.get<string>('app.email.smtpPassword', '');
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass } : undefined,
    });
    return this.transporter;
  }

  private fromHeader(): string {
    const name = this.configService.get<string>('app.email.fromName', STORE_NAME);
    const address = this.configService.get<string>(
      'app.email.fromAddress',
      'no-reply@vsboutique.shop',
    );
    return `"${name}" <${address}>`;
  }

  /** Low-level send -- logs the attempt, mocks it out when disabled, otherwise sends over SMTP. */
  async send(dto: SendEmailDto, actorId?: string) {
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
    } catch (err: any) {
      this.logger.error(`Email send failed: ${dto.to} / ${dto.template}`, err?.stack);
      return this.prisma.emailLog.update({
        where: { id: log.id },
        data: { status: 'FAILED', error: err?.message ?? 'Email send failed' },
      });
    }
  }

  private layout(bodyHtml: string): string {
    const logoUrl = `${this.configService.get<string>('app.frontendUrl')}/brand/logo-icon.png`;
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

  async sendPasswordResetEmail(to: string, resetUrl: string, userId?: string) {
    const html = this.layout(`
      <h2 style="margin:0 0 12px;color:#0284c7;font-size:18px;">Reset your password</h2>
      <p>We received a request to reset the password on your account. This link expires in 15 minutes.</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${resetUrl}" style="background:#0284c7;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:13px;display:inline-block;">Reset Password</a>
      </p>
      <p style="color:#78716c;font-size:12px;">If you didn't request this, you can safely ignore this email -- your password won't change.</p>
    `);
    return this.send(
      { to, template: 'PASSWORD_RESET', subject: `${STORE_NAME}: Reset your password`, html, userId },
    );
  }

  async sendWelcomeEmail(to: string, firstName: string | undefined, userId?: string) {
    const html = this.layout(`
      <h2 style="margin:0 0 12px;color:#0284c7;font-size:18px;">Welcome${firstName ? `, ${firstName}` : ''}!</h2>
      <p>Thank you for creating an account with ${STORE_NAME}. Explore our latest sarees, lehengas and designer wear online.</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${this.configService.get<string>('app.frontendUrl')}" style="background:#0284c7;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:13px;display:inline-block;">Start Shopping</a>
      </p>
    `);
    return this.send({ to, template: 'WELCOME', subject: `Welcome to ${STORE_NAME}`, html, userId });
  }

  async sendOrderConfirmationEmail(params: {
    to: string;
    userId?: string;
    orderNumber: string;
    items: { productName: string; variantTitle?: string; quantity: number; unitPrice: number }[];
    subtotal: number;
    discountTotal?: number;
    taxTotal?: number;
    shippingCharge?: number;
    grandTotal: number;
  }) {
    const itemRows = params.items
      .map(
        (i) => `
      <tr>
        <td style="padding:6px 0;border-bottom:1px solid #f5f5f4;">${i.productName}${i.variantTitle ? ` <span style="color:#a8a29e;">(${i.variantTitle})</span>` : ''}</td>
        <td style="padding:6px 0;border-bottom:1px solid #f5f5f4;text-align:center;">x${i.quantity}</td>
        <td style="padding:6px 0;border-bottom:1px solid #f5f5f4;text-align:right;">₹${(i.unitPrice * i.quantity).toFixed(2)}</td>
      </tr>`,
      )
      .join('');

    const trackUrl = `${this.configService.get<string>('app.frontendUrl')}/orders/track/${encodeURIComponent(params.orderNumber)}`;

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
}
