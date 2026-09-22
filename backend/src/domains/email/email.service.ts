import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '@database/prisma.service';
import { AuditService } from '@domains/audit/audit.service';
import {
  SendEmailDto,
  UpdateEmailConfigDto,
  SendTestEmailDto,
  EmailConfigResponse,
} from './email.types';

const STORE_NAME = "Vasanthi's Signature";
const STORE_ADDRESS =
  'Road No. 12, Banjara Hills, Hyderabad - 500034, Telangana, India';
const STORE_PHONE = '+91 98765 43210';
const DEFAULT_FROM = 'orders@vasanthissignature.in';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  private async getSetting(
    key: string,
    defaultVal: string = '',
  ): Promise<string> {
    try {
      const setting = await this.prisma.appSetting.findUnique({
        where: { key },
      });
      return setting?.value ?? defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private async setSetting(
    key: string,
    value: string,
    description?: string,
  ): Promise<void> {
    await this.prisma.appSetting.upsert({
      where: { key },
      update: { value, description: description || undefined },
      create: { key, value, description: description || undefined },
    });
  }

  async isEnabled(): Promise<boolean> {
    const dbVal = await this.getSetting('email_enabled');
    if (dbVal !== '') {
      return dbVal === 'true';
    }
    return this.configService.get<boolean>('app.features.email', false);
  }

  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) return this.transporter;

    const dbHost = await this.getSetting('email_smtp_host');
    const dbPort = await this.getSetting('email_smtp_port');
    const dbSecure = await this.getSetting('email_smtp_secure');
    const dbUser = await this.getSetting('email_smtp_user');
    const dbPass = await this.getSetting('email_smtp_password');

    const host =
      dbHost || this.configService.get<string>('app.email.smtpHost', '');
    const port = dbPort
      ? parseInt(dbPort, 10)
      : this.configService.get<number>('app.email.smtpPort', 587);
    const secure =
      dbSecure !== ''
        ? dbSecure === 'true'
        : this.configService.get<boolean>('app.email.smtpSecure', false);
    const user =
      dbUser || this.configService.get<string>('app.email.smtpUser', '');
    const pass =
      dbPass || this.configService.get<string>('app.email.smtpPassword', '');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass } : undefined,
    });
    return this.transporter;
  }

  private async fromHeader(): Promise<string> {
    const dbName = await this.getSetting('email_from_name');
    const dbAddress = await this.getSetting('email_from_address');

    const name =
      dbName ||
      this.configService.get<string>('app.email.fromName', STORE_NAME);
    const address =
      dbAddress ||
      this.configService.get<string>('app.email.fromAddress', DEFAULT_FROM);
    return `"${name}" <${address}>`;
  }

  /** Read current settings for admin display */
  async getConfig(): Promise<EmailConfigResponse> {
    const [
      dbEnabled,
      dbProvider,
      dbHost,
      dbPort,
      dbSecure,
      dbUser,
      dbPass,
      dbFromAddress,
      dbFromName,
      dbOrderConf,
      dbInvoicePdf,
    ] = await Promise.all([
      this.getSetting('email_enabled'),
      this.getSetting('email_provider'),
      this.getSetting('email_smtp_host'),
      this.getSetting('email_smtp_port'),
      this.getSetting('email_smtp_secure'),
      this.getSetting('email_smtp_user'),
      this.getSetting('email_smtp_password'),
      this.getSetting('email_from_address'),
      this.getSetting('email_from_name'),
      this.getSetting('email_order_confirmation_enabled'),
      this.getSetting('email_invoice_pdf_enabled'),
    ]);

    const enabled =
      dbEnabled !== ''
        ? dbEnabled === 'true'
        : this.configService.get<boolean>('app.features.email', false);
    const provider = dbProvider || 'AMAZON_SES';
    const smtpHost =
      dbHost ||
      this.configService.get<string>(
        'app.email.smtpHost',
        'email-smtp.ap-south-1.amazonaws.com',
      );
    const smtpPort = dbPort
      ? parseInt(dbPort, 10)
      : this.configService.get<number>('app.email.smtpPort', 587);
    const smtpSecure =
      dbSecure !== ''
        ? dbSecure === 'true'
        : this.configService.get<boolean>('app.email.smtpSecure', false);
    const smtpUser =
      dbUser || this.configService.get<string>('app.email.smtpUser', '');
    const hasPassword = Boolean(
      dbPass || this.configService.get<string>('app.email.smtpPassword', ''),
    );
    const fromAddress =
      dbFromAddress ||
      this.configService.get<string>('app.email.fromAddress', DEFAULT_FROM);
    const fromName =
      dbFromName ||
      this.configService.get<string>('app.email.fromName', STORE_NAME);
    const enableOrderConfirmation =
      dbOrderConf !== '' ? dbOrderConf === 'true' : true;
    const enableInvoicePdf =
      dbInvoicePdf !== '' ? dbInvoicePdf === 'true' : true;

    return {
      enabled,
      provider,
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      hasPassword,
      fromAddress,
      fromName,
      enableOrderConfirmation,
      enableInvoicePdf,
    };
  }

  /** Update email settings from Super Admin */
  async updateConfig(
    dto: UpdateEmailConfigDto,
    actorId?: string,
  ): Promise<EmailConfigResponse> {
    if (dto.enabled !== undefined) {
      await this.setSetting(
        'email_enabled',
        String(dto.enabled),
        'Transactional Email Master Toggle',
      );
    }
    if (dto.provider !== undefined) {
      await this.setSetting(
        'email_provider',
        dto.provider,
        'Email Provider (Amazon SES / SendGrid / Custom)',
      );
    }
    if (dto.smtpHost !== undefined) {
      await this.setSetting('email_smtp_host', dto.smtpHost, 'SMTP Host');
    }
    if (dto.smtpPort !== undefined) {
      await this.setSetting(
        'email_smtp_port',
        String(dto.smtpPort),
        'SMTP Port',
      );
    }
    if (dto.smtpSecure !== undefined) {
      await this.setSetting(
        'email_smtp_secure',
        String(dto.smtpSecure),
        'SMTP Secure TLS',
      );
    }
    if (dto.smtpUser !== undefined) {
      await this.setSetting(
        'email_smtp_user',
        dto.smtpUser,
        'SMTP Username / Access Key ID',
      );
    }
    if (dto.smtpPassword !== undefined && dto.smtpPassword.trim() !== '') {
      await this.setSetting(
        'email_smtp_password',
        dto.smtpPassword,
        'SMTP Password / Secret Key',
      );
    }
    if (dto.fromAddress !== undefined) {
      await this.setSetting(
        'email_from_address',
        dto.fromAddress,
        'Default Sender Email Address',
      );
    }
    if (dto.fromName !== undefined) {
      await this.setSetting(
        'email_from_name',
        dto.fromName,
        'Default Sender Name',
      );
    }
    if (dto.enableOrderConfirmation !== undefined) {
      await this.setSetting(
        'email_order_confirmation_enabled',
        String(dto.enableOrderConfirmation),
        'Send automated order confirmation emails',
      );
    }
    if (dto.enableInvoicePdf !== undefined) {
      await this.setSetting(
        'email_invoice_pdf_enabled',
        String(dto.enableInvoicePdf),
        'Generate & attach PDF invoice in emails',
      );
    }

    // Reset cached transporter so next send uses updated credentials immediately
    this.transporter = null;

    await this.auditService.log({
      action: 'EMAIL_CONFIG_UPDATED',
      module: 'email',
      resource: 'email_config',
      resourceId: 'global',
      userId: actorId,
      newValue: {
        provider: dto.provider,
        smtpHost: dto.smtpHost,
        fromAddress: dto.fromAddress,
        enabled: dto.enabled,
      },
    });

    return this.getConfig();
  }

  /** Low-level send -- logs attempt in DB, sends over SMTP or mocks if disabled. */
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

    const active = await this.isEnabled();
    if (!active) {
      const updated = await this.prisma.emailLog.update({
        where: { id: log.id },
        data: {
          status: 'MOCK_SENT',
          providerRef: `mock_${log.id.slice(0, 8)}`,
          metadata: {
            note: 'Email disabled; mocked as sent. Set ENABLE_EMAIL=true or configure Amazon SES / SendGrid in Admin.',
          },
        },
      });
      this.logger.warn(`Email mocked (disabled): ${dto.to} / ${dto.template}`);
      return updated;
    }

    try {
      const transporter = await this.getTransporter();
      const from = await this.fromHeader();

      const mailOptions: any = {
        from,
        to: dto.to,
        subject: dto.subject,
        html: dto.html,
      };

      if (dto.attachments && dto.attachments.length > 0) {
        mailOptions.attachments = dto.attachments.map((att) => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType || 'application/octet-stream',
          encoding: att.encoding,
        }));
      }

      const info = await transporter.sendMail(mailOptions);

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
      this.logger.error(
        `Email send failed: ${dto.to} / ${dto.template}`,
        err?.stack,
      );
      return this.prisma.emailLog.update({
        where: { id: log.id },
        data: { status: 'FAILED', error: err?.message ?? 'Email send failed' },
      });
    }
  }

  private layout(bodyHtml: string): string {
    const frontendUrl = this.configService.get<string>(
      'app.frontendUrl',
      'https://vasanthissignature.in',
    );
    const logoUrl = `${frontendUrl}/brand/logo-full.png`;
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${STORE_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#faf9f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#171717;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf9f8;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e5e5e5;box-shadow:0 4px 20px rgba(0,0,0,0.04);">
        <!-- BRAND HEADER -->
        <tr><td style="background:#ffffff;padding:28px 24px;text-align:center;border-bottom:2px solid #f0ece9;">
          <img src="${logoUrl}" alt="${STORE_NAME}" height="42" style="max-width:240px;height:42px;object-fit:contain;" />
          <div style="color:#0284c7;font-size:11px;font-weight:700;letter-spacing:1.5px;margin-top:8px;text-transform:uppercase;">Luxury Ethnic Wear & Haute Couture</div>
        </td></tr>

        <!-- MAIN CONTENT -->
        <tr><td style="padding:32px 28px;color:#262626;font-size:14px;line-height:1.65;">
          ${bodyHtml}
        </td></tr>

        <!-- BRAND FOOTER -->
        <tr><td style="padding:24px 28px;background:#fbfaf9;border-top:1px solid #f0ece9;color:#737373;font-size:11px;text-align:center;line-height:1.6;">
          <p style="margin:0 0 4px;font-weight:700;color:#171717;">${STORE_NAME}</p>
          <p style="margin:0 0 6px;">${STORE_ADDRESS}</p>
          <p style="margin:0;">Support & Customer Helpline: <a href="tel:${STORE_PHONE}" style="color:#0284c7;text-decoration:none;font-weight:600;">${STORE_PHONE}</a> | <a href="https://vasanthissignature.in" style="color:#0284c7;text-decoration:none;font-weight:600;">vasanthissignature.in</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
  }

  async sendTestEmail(dto: SendTestEmailDto, actorId?: string) {
    const config = await this.getConfig();
    const html = this.layout(`
      <div style="text-align:center;margin-bottom:20px;">
        <span style="background:#e0f2fe;color:#0284c7;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;text-transform:uppercase;">Verified Connection</span>
        <h2 style="margin:12px 0 6px;color:#0f172a;font-size:20px;font-weight:700;">Transactional Email Connected!</h2>
        <p style="color:#525252;font-size:13px;margin:0;">Your SMTP gateway (${config.provider}) is connected and functioning perfectly.</p>
      </div>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:16px;margin:20px 0;font-size:12px;">
        <div style="margin-bottom:8px;font-weight:700;color:#0f172a;">Configuration Summary:</div>
        <div style="color:#475569;margin-bottom:4px;">• <strong>Provider:</strong> ${config.provider}</div>
        <div style="color:#475569;margin-bottom:4px;">• <strong>SMTP Host:</strong> ${config.smtpHost}:${config.smtpPort}</div>
        <div style="color:#475569;margin-bottom:4px;">• <strong>Sender Address:</strong> ${config.fromAddress}</div>
        <div style="color:#475569;">• <strong>Status:</strong> Live & Ready for Automated PDF Invoices</div>
      </div>

      <p style="color:#737373;font-size:12px;text-align:center;margin-top:24px;">
        Customers will automatically receive order confirmation and tax invoice emails from this address.
      </p>
    `);

    return this.send(
      {
        to: dto.to,
        template: 'TEST_EMAIL',
        subject: `[TEST] ${STORE_NAME}: SMTP Connection Verified`,
        html,
      },
      actorId,
    );
  }

  async sendPasswordResetEmail(to: string, resetUrl: string, userId?: string) {
    const html = this.layout(`
      <h2 style="margin:0 0 12px;color:#0f172a;font-size:18px;">Reset Your Password</h2>
      <p>We received a request to reset the password on your account with ${STORE_NAME}. This secure link will expire in 15 minutes.</p>
      <p style="text-align:center;margin:28px 0;">
        <a href="${resetUrl}" style="background:#0284c7;color:#ffffff;padding:12px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:13px;display:inline-block;">Reset Password</a>
      </p>
      <p style="color:#737373;font-size:12px;">If you did not request a password reset, please ignore this email. Your account remains completely secure.</p>
    `);
    return this.send({
      to,
      template: 'PASSWORD_RESET',
      subject: `${STORE_NAME}: Password Reset Request`,
      html,
      userId,
    });
  }

  async sendWelcomeEmail(
    to: string,
    firstName: string | undefined,
    userId?: string,
  ) {
    const frontendUrl = this.configService.get<string>(
      'app.frontendUrl',
      'https://vasanthissignature.in',
    );
    const html = this.layout(`
      <h2 style="margin:0 0 12px;color:#0f172a;font-size:18px;">Welcome to ${STORE_NAME}${firstName ? `, ${firstName}` : ''}!</h2>
      <p>Thank you for creating an account with ${STORE_NAME}. We are delighted to bring you exclusive designer gowns, bespoke lehengas, and handcrafted couture.</p>
      <p style="text-align:center;margin:28px 0;">
        <a href="${frontendUrl}" style="background:#0284c7;color:#ffffff;padding:12px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:13px;display:inline-block;">Explore Collection</a>
      </p>
    `);
    return this.send({
      to,
      template: 'WELCOME',
      subject: `Welcome to ${STORE_NAME}`,
      html,
      userId,
    });
  }

  async sendOrderConfirmationEmail(params: {
    to: string;
    userId?: string;
    orderNumber: string;
    items: {
      productName: string;
      variantTitle?: string;
      quantity: number;
      unitPrice: number;
    }[];
    subtotal: number;
    discountTotal?: number;
    taxTotal?: number;
    shippingCharge?: number;
    grandTotal: number;
    paymentMethod?: string;
    shippingAddress?: string;
    deliverySlot?: string;
  }) {
    const frontendUrl = this.configService.get<string>(
      'app.frontendUrl',
      'https://vasanthissignature.in',
    );
    const trackUrl = `${frontendUrl}/orders/track/${encodeURIComponent(params.orderNumber)}`;
    const invoiceUrl = `${frontendUrl}/orders/details/${encodeURIComponent(params.orderNumber)}`;

    const itemRows = params.items
      .map(
        (i) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f5f5f4;font-weight:600;color:#171717;">
          ${i.productName}
          ${i.variantTitle ? `<div style="font-size:11px;color:#737373;font-weight:normal;">Size / Option: ${i.variantTitle}</div>` : ''}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f5f5f4;text-align:center;color:#525252;">x${i.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f5f5f4;text-align:right;font-weight:600;color:#171717;">₹${(i.unitPrice * i.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      </tr>`,
      )
      .join('');

    const html = this.layout(`
      <div style="text-align:center;margin-bottom:24px;">
        <span style="background:#ecfdf5;color:#047857;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;text-transform:uppercase;">Order Confirmed</span>
        <h2 style="margin:12px 0 4px;color:#0f172a;font-size:22px;font-weight:700;">Thank you for your order!</h2>
        <p style="color:#525252;font-size:13px;margin:0;">Order Reference: <strong style="color:#0284c7;">#${params.orderNumber}</strong></p>
      </div>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:16px 20px;margin-bottom:24px;">
        <table role="presentation" width="100%" style="font-size:13px;border-collapse:collapse;">
          <thead>
            <tr>
              <th style="text-align:left;border-bottom:1px solid #cbd5e1;padding-bottom:8px;color:#64748b;font-size:11px;text-transform:uppercase;">Item</th>
              <th style="text-align:center;border-bottom:1px solid #cbd5e1;padding-bottom:8px;color:#64748b;font-size:11px;text-transform:uppercase;">Qty</th>
              <th style="text-align:right;border-bottom:1px solid #cbd5e1;padding-bottom:8px;color:#64748b;font-size:11px;text-transform:uppercase;">Price</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        <table role="presentation" width="100%" style="font-size:13px;margin-top:16px;">
          <tr>
            <td style="color:#64748b;padding:4px 0;">Subtotal MRP</td>
            <td style="text-align:right;color:#171717;font-weight:600;">₹${params.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>
          ${
            params.discountTotal
              ? `<tr>
                  <td style="color:#15803d;padding:4px 0;">Promotional Discount</td>
                  <td style="text-align:right;color:#15803d;font-weight:600;">-₹${params.discountTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>`
              : ''
          }
          ${
            params.taxTotal
              ? `<tr>
                  <td style="color:#64748b;padding:4px 0;">Estimated GST</td>
                  <td style="text-align:right;color:#171717;">₹${params.taxTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>`
              : ''
          }
          <tr>
            <td style="color:#64748b;padding:4px 0;">Insured Express Shipping</td>
            <td style="text-align:right;color:${params.shippingCharge ? '#171717' : '#15803d'};font-weight:600;">
              ${params.shippingCharge ? `₹${params.shippingCharge.toFixed(2)}` : 'FREE'}
            </td>
          </tr>
          <tr>
            <td style="font-weight:700;padding-top:12px;border-top:1px solid #cbd5e1;color:#0f172a;font-size:15px;">Total Amount Paid</td>
            <td style="text-align:right;font-weight:700;color:#0284c7;padding-top:12px;border-top:1px solid #cbd5e1;font-size:16px;">
              ₹${params.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </td>
          </tr>
        </table>
      </div>

      <div style="text-align:center;margin:28px 0 16px;">
        <a href="${trackUrl}" style="background:#0284c7;color:#ffffff;padding:12px 28px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:13px;display:inline-block;margin:0 4px 8px;">
          Track Shipment
        </a>
        <a href="${invoiceUrl}" style="background:#f1f5f9;color:#0f172a;border:1px solid #cbd5e1;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:13px;display:inline-block;margin:0 4px 8px;">
          Download Tax Invoice
        </a>
      </div>
    `);

    return this.send({
      to: params.to,
      template: 'ORDER_CONFIRMED',
      subject: `${STORE_NAME}: Order #${params.orderNumber} Confirmed & Tax Invoice`,
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
