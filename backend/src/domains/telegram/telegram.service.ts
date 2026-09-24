import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@database/prisma.service';
import axios from 'axios';
import {
  TelegramConfig,
  UpdateTelegramSettingsDto,
  TelegramWebhookUpdate,
  DEFAULT_TELEGRAM_TEMPLATES,
} from './telegram.types';

const SETTING_KEY_TELEGRAM_CONFIG = 'telegram_automation_config';
const DEFAULT_BOT_TOKEN = '8825015214:AAFaPKBzkr7LXkJsWnLkaPKLcRHafdEQiVk';
const DEFAULT_ALLOWED_CHAT_IDS = ['2091440465'];

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private cachedConfig: TelegramConfig | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.loadConfig();
    this.logger.log(
      `TelegramService initialized. Enabled: ${this.cachedConfig?.enabled}, Allowed Chat IDs: ${this.cachedConfig?.allowedChatIds?.join(', ')}`,
    );
  }

  private interpolate(
    template: string,
    variables: Record<string, any>,
  ): string {
    if (!template) return '';
    return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
      const val = variables[key];
      if (val === undefined || val === null) return '';
      return String(val);
    });
  }

  async loadConfig(): Promise<TelegramConfig> {
    try {
      const settingRow = await this.prisma.appSetting.findUnique({
        where: { key: SETTING_KEY_TELEGRAM_CONFIG },
      });

      if (settingRow && settingRow.value) {
        const parsed =
          typeof settingRow.value === 'string'
            ? JSON.parse(settingRow.value)
            : settingRow.value;

        this.cachedConfig = {
          botToken:
            parsed.botToken ||
            this.configService.get<string>('TELEGRAM_BOT_TOKEN') ||
            DEFAULT_BOT_TOKEN,
          allowedChatIds:
            Array.isArray(parsed.allowedChatIds) &&
            parsed.allowedChatIds.length > 0
              ? parsed.allowedChatIds.map(String)
              : DEFAULT_ALLOWED_CHAT_IDS,
          enabled: parsed.enabled !== false,
          notifyOnOnlineOrder: parsed.notifyOnOnlineOrder !== false,
          notifyOnPosSale: parsed.notifyOnPosSale !== false,
          notifyOnShiftClose: parsed.notifyOnShiftClose !== false,
          notifyOnLowStock: parsed.notifyOnLowStock !== false,
          templates: {
            ...DEFAULT_TELEGRAM_TEMPLATES,
            ...(parsed.templates || {}),
          },
        };
        return this.cachedConfig;
      }
    } catch (err) {
      this.logger.warn(
        `Could not load telegram config from DB: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    this.cachedConfig = {
      botToken:
        this.configService.get<string>('TELEGRAM_BOT_TOKEN') ||
        DEFAULT_BOT_TOKEN,
      allowedChatIds: DEFAULT_ALLOWED_CHAT_IDS,
      enabled: true,
      notifyOnOnlineOrder: true,
      notifyOnPosSale: true,
      notifyOnShiftClose: true,
      notifyOnLowStock: true,
      templates: { ...DEFAULT_TELEGRAM_TEMPLATES },
    };
    return this.cachedConfig;
  }

  async getSettings(): Promise<TelegramConfig> {
    return this.loadConfig();
  }

  async updateSettings(
    dto: UpdateTelegramSettingsDto,
    _updatedBy?: string,
  ): Promise<TelegramConfig> {
    const current = await this.loadConfig();
    const updated: TelegramConfig = {
      botToken: (dto.botToken || current.botToken || '').trim(),
      allowedChatIds: dto.allowedChatIds
        ? dto.allowedChatIds.map(String).filter(Boolean)
        : current.allowedChatIds,
      enabled: dto.enabled !== undefined ? dto.enabled : current.enabled,
      notifyOnOnlineOrder:
        dto.notifyOnOnlineOrder !== undefined
          ? dto.notifyOnOnlineOrder
          : current.notifyOnOnlineOrder,
      notifyOnPosSale:
        dto.notifyOnPosSale !== undefined
          ? dto.notifyOnPosSale
          : current.notifyOnPosSale,
      notifyOnShiftClose:
        dto.notifyOnShiftClose !== undefined
          ? dto.notifyOnShiftClose
          : current.notifyOnShiftClose,
      notifyOnLowStock:
        dto.notifyOnLowStock !== undefined
          ? dto.notifyOnLowStock
          : current.notifyOnLowStock,
      templates: {
        ...current.templates,
        ...(dto.templates || {}),
      },
    };

    await this.prisma.appSetting.upsert({
      where: { key: SETTING_KEY_TELEGRAM_CONFIG },
      create: {
        key: SETTING_KEY_TELEGRAM_CONFIG,
        value: JSON.stringify(updated),
        type: 'JSON',
        group: 'integrations',
        description: 'Telegram Bot automation and message templates',
      },
      update: {
        value: JSON.stringify(updated),
        updatedAt: new Date(),
      },
    });

    this.cachedConfig = updated;
    this.logger.log('Telegram automation settings updated successfully');
    return updated;
  }

  async sendMessage(
    chatId: string | number,
    text: string,
    parseMode: 'Markdown' | 'HTML' = 'Markdown',
  ): Promise<boolean> {
    const config = this.cachedConfig || (await this.loadConfig());
    if (!config.enabled || !config.botToken) {
      this.logger.debug('Telegram bot is disabled or missing token');
      return false;
    }

    try {
      const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
      const res = await axios.post(
        url,
        {
          chat_id: chatId,
          text,
          parse_mode: parseMode,
          disable_web_page_preview: true,
        },
        { timeout: 8000 },
      );
      return res.data?.ok === true;
    } catch (err: any) {
      this.logger.error(
        `Failed to send Telegram message to ${chatId}: ${err.response?.data?.description || err.message}`,
      );
      // Fallback: retry with plain text if markdown parse error
      if (err.response?.data?.description?.includes("can't parse entities")) {
        try {
          const fallbackUrl = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
          await axios.post(
            fallbackUrl,
            {
              chat_id: chatId,
              text: text.replace(/[*_`[\]()]/g, ''),
              disable_web_page_preview: true,
            },
            { timeout: 8000 },
          );
          return true;
        } catch {}
      }
      return false;
    }
  }

  async broadcastAlert(
    text: string,
    parseMode: 'Markdown' | 'HTML' = 'Markdown',
  ): Promise<void> {
    const config = this.cachedConfig || (await this.loadConfig());
    if (!config.enabled || !config.allowedChatIds?.length) return;

    for (const chatId of config.allowedChatIds) {
      if (chatId) {
        await this.sendMessage(chatId, text, parseMode).catch(() => {});
      }
    }
  }

  async sendOnlineOrderAlert(orderData: {
    orderNumber: string;
    customerName?: string;
    customerPhone?: string;
    shippingCity?: string;
    shippingState?: string;
    grandTotal: number | string;
    paymentMethod?: string;
    paymentStatus?: string;
    items: Array<{
      productName: string;
      variantName?: string;
      quantity: number;
      price: number | string;
    }>;
    createdAt?: Date | string;
  }): Promise<void> {
    const config = this.cachedConfig || (await this.loadConfig());
    if (!config.enabled || !config.notifyOnOnlineOrder) return;

    const itemsList = (orderData.items || [])
      .map(
        (i) =>
          `• ${i.productName}${i.variantName ? ` (${i.variantName})` : ''} × ${i.quantity} — ₹${Number(i.price).toLocaleString('en-IN')}`,
      )
      .join('\n');

    const formattedDate = new Date(
      orderData.createdAt || Date.now(),
    ).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const template =
      config.templates?.ONLINE_ORDER || DEFAULT_TELEGRAM_TEMPLATES.ONLINE_ORDER;
    const message = this.interpolate(template, {
      orderNumber: orderData.orderNumber,
      customerName: orderData.customerName || 'Online Customer',
      customerPhone: orderData.customerPhone || 'N/A',
      shippingCity: orderData.shippingCity || 'Direct',
      shippingState: orderData.shippingState || 'India',
      grandTotal: Number(orderData.grandTotal).toLocaleString('en-IN'),
      paymentMethod: orderData.paymentMethod || 'Online (Razorpay)',
      paymentStatus: orderData.paymentStatus || 'PAID',
      itemsCount: orderData.items?.length || 1,
      itemsList: itemsList || '• Order Items',
      createdAt: formattedDate,
    });

    await this.broadcastAlert(message);
  }

  async sendPosSaleAlert(saleData: {
    billNumber: string;
    cashierName?: string;
    paymentMethod?: string;
    grandTotal: number | string;
    items: Array<{
      productName: string;
      sku?: string;
      quantity: number;
      unitPrice: number | string;
    }>;
    createdAt?: Date | string;
  }): Promise<void> {
    const config = this.cachedConfig || (await this.loadConfig());
    if (!config.enabled || !config.notifyOnPosSale) return;

    const itemsList = (saleData.items || [])
      .map(
        (i) =>
          `• ${i.productName} × ${i.quantity} — ₹${(Number(i.unitPrice) * i.quantity).toLocaleString('en-IN')}`,
      )
      .join('\n');

    const formattedDate = new Date(
      saleData.createdAt || Date.now(),
    ).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const template =
      config.templates?.POS_SALE || DEFAULT_TELEGRAM_TEMPLATES.POS_SALE;
    const message = this.interpolate(template, {
      billNumber: saleData.billNumber,
      cashierName: saleData.cashierName || 'Store Cashier',
      paymentMethod: saleData.paymentMethod || 'CASH / UPI',
      grandTotal: Number(saleData.grandTotal).toLocaleString('en-IN'),
      itemsCount: saleData.items?.length || 1,
      itemsList: itemsList || '• In-Store Items',
      createdAt: formattedDate,
    });

    await this.broadcastAlert(message);
  }

  async sendShiftCloseAlert(shiftData: {
    terminalId: string;
    cashierName?: string;
    totalSales: number | string;
    ordersCount: number;
    cashExpected: number | string;
    cashActual: number | string;
    discrepancy: number | string;
    closedAt?: Date | string;
  }): Promise<void> {
    const config = this.cachedConfig || (await this.loadConfig());
    if (!config.enabled || !config.notifyOnShiftClose) return;

    const formattedDate = new Date(
      shiftData.closedAt || Date.now(),
    ).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const template =
      config.templates?.SHIFT_CLOSE || DEFAULT_TELEGRAM_TEMPLATES.SHIFT_CLOSE;
    const message = this.interpolate(template, {
      terminalId: shiftData.terminalId,
      cashierName: shiftData.cashierName || 'Staff',
      totalSales: Number(shiftData.totalSales).toLocaleString('en-IN'),
      ordersCount: shiftData.ordersCount,
      cashExpected: Number(shiftData.cashExpected).toLocaleString('en-IN'),
      cashActual: Number(shiftData.cashActual).toLocaleString('en-IN'),
      discrepancy: Number(shiftData.discrepancy).toLocaleString('en-IN'),
      closedAt: formattedDate,
    });

    await this.broadcastAlert(message);
  }

  async sendLowStockAlert(stockData: {
    productName: string;
    sku: string;
    currentStock: number;
    threshold: number;
  }): Promise<void> {
    const config = this.cachedConfig || (await this.loadConfig());
    if (!config.enabled || !config.notifyOnLowStock) return;

    const template =
      config.templates?.LOW_STOCK || DEFAULT_TELEGRAM_TEMPLATES.LOW_STOCK;
    const message = this.interpolate(template, {
      productName: stockData.productName,
      sku: stockData.sku,
      currentStock: stockData.currentStock,
      threshold: stockData.threshold,
    });

    await this.broadcastAlert(message);
  }

  async handleWebhookUpdate(update: TelegramWebhookUpdate): Promise<void> {
    const message = update?.message;
    if (!message || !message.text) return;

    const senderId = String(message.from?.id || message.chat?.id);
    const text = message.text.trim();
    const config = this.cachedConfig || (await this.loadConfig());

    // 🔒 Strict Security Whitelist Check
    const isAllowed = config.allowedChatIds?.some(
      (id) => String(id) === senderId,
    );
    if (!isAllowed) {
      this.logger.warn(
        `Unauthorized Telegram access attempt from ID: ${senderId} (@${message.from?.username || 'unknown'})`,
      );
      await this.sendMessage(
        senderId,
        `⛔ *Access Denied*\n\nYour Telegram User ID (\`${senderId}\`) is not authorized to access Vasanthi Designers store management.\n\n_Contact the Super Administrator to request access._`,
      );
      return;
    }

    // Process Allowed Commands
    const lower = text.toLowerCase();

    if (lower === '/start' || lower === '/help') {
      await this.sendMessage(
        senderId,
        `👑 *Welcome to Vasanthi Designers Store Bot!*\n━━━━━━━━━━━━━━━━━━━━\nHello *${message.from?.first_name || 'Admin'}*, you are connected to the live store management system.\n\n*Available Commands:*\n• \`/today\` or \`/sales\` — Today's full business summary & revenue\n• \`/pos\` — Today's in-store POS sales report\n• \`/online\` — Today's online store orders\n• \`/orders\` — Recent 5 customer orders\n• \`/stock\` or \`/lowstock\` — Low stock alerts\n• \`/test\` — Ping test live bot connection\n\n_Instant alerts for new online orders and POS sales are enabled._ ⚡`,
      );
      return;
    }

    if (lower === '/today' || lower === '/sales') {
      await this.replyTodaySummary(senderId);
      return;
    }

    if (lower === '/pos') {
      await this.replyPosSummary(senderId);
      return;
    }

    if (lower === '/online') {
      await this.replyOnlineSummary(senderId);
      return;
    }

    if (lower === '/stock' || lower === '/lowstock') {
      await this.replyLowStock(senderId);
      return;
    }

    if (lower === '/orders') {
      await this.replyRecentOrders(senderId);
      return;
    }

    if (lower === '/test') {
      await this.sendMessage(
        senderId,
        `✅ *Connection Healthy!*\n━━━━━━━━━━━━━━━━━━━━\n• *Status:* Online & Active\n• *Server Time:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n• *Authorized ID:* \`${senderId}\``,
      );
      return;
    }

    // Fallback: smart natural query handling
    if (
      lower.includes('today') ||
      lower.includes('sale') ||
      lower.includes('booking') ||
      lower.includes('revenue')
    ) {
      await this.replyTodaySummary(senderId);
      return;
    }

    await this.sendMessage(
      senderId,
      `❓ Unknown command. Send \`/help\` or \`/today\` to see available reports.`,
    );
  }

  private async replyTodaySummary(chatId: string): Promise<void> {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );
    const endOfToday = new Date(startOfToday.getTime() + 86400000);

    const [posOrders, onlineOrders, lowStockCount] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          channel: 'POS_SHOPORA',
          status: { notIn: ['CANCELLED', 'RETURNED', 'REFUNDED'] },
          createdAt: { gte: startOfToday, lt: endOfToday },
        },
        select: { grandTotal: true, items: { select: { quantity: true } } },
      }),
      this.prisma.order.findMany({
        where: {
          channel: { not: 'POS_SHOPORA' },
          status: { notIn: ['CANCELLED', 'RETURNED', 'REFUNDED'] },
          createdAt: { gte: startOfToday, lt: endOfToday },
        },
        select: { grandTotal: true, items: { select: { quantity: true } } },
      }),
      this.prisma.inventory.count({
        where: { availableQuantity: { lte: 5 } },
      }),
    ]);

    const posRevenue = posOrders.reduce(
      (sum, o) => sum + Number(o.grandTotal || 0),
      0,
    );
    const posItems = posOrders.reduce(
      (sum, o) =>
        sum + o.items.reduce((iSum, item) => iSum + (item.quantity || 1), 0),
      0,
    );

    const onlineRevenue = onlineOrders.reduce(
      (sum, o) => sum + Number(o.grandTotal || 0),
      0,
    );
    const onlineItems = onlineOrders.reduce(
      (sum, o) =>
        sum + o.items.reduce((iSum, item) => iSum + (item.quantity || 1), 0),
      0,
    );

    const totalRevenue = posRevenue + onlineRevenue;
    const totalOrders = posOrders.length + onlineOrders.length;
    const totalItems = posItems + onlineItems;

    const dateStr = now.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
    });

    const config = this.cachedConfig || (await this.loadConfig());
    const template =
      config.templates?.DAILY_SUMMARY ||
      DEFAULT_TELEGRAM_TEMPLATES.DAILY_SUMMARY;

    const message = this.interpolate(template, {
      reportDate: dateStr,
      totalRevenue: totalRevenue.toLocaleString('en-IN'),
      totalOrders,
      itemsSold: totalItems,
      posRevenue: posRevenue.toLocaleString('en-IN'),
      posOrders: posOrders.length,
      onlineRevenue: onlineRevenue.toLocaleString('en-IN'),
      onlineOrders: onlineOrders.length,
      lowStockCount,
    });

    await this.sendMessage(chatId, message);
  }

  private async replyPosSummary(chatId: string): Promise<void> {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );
    const endOfToday = new Date(startOfToday.getTime() + 86400000);

    const orders = await this.prisma.order.findMany({
      where: {
        channel: 'POS_SHOPORA',
        createdAt: { gte: startOfToday, lt: endOfToday },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        items: { select: { productName: true, quantity: true } },
      },
    });

    const activeOrders = orders.filter(
      (o) => !['CANCELLED', 'RETURNED', 'REFUNDED'].includes(o.status),
    );
    const totalRev = activeOrders.reduce(
      (sum, o) => sum + Number(o.grandTotal || 0),
      0,
    );

    let text = `🧾 *TODAY'S IN-STORE POS SALES*\n━━━━━━━━━━━━━━━━━━━━\n💰 *Total POS Revenue:* ₹${totalRev.toLocaleString('en-IN')}\n📦 *Total Bills:* ${activeOrders.length}\n\n`;

    if (orders.length === 0) {
      text += `_No POS sales recorded today yet._`;
    } else {
      text += `*Recent Bills:*\n`;
      orders.slice(0, 5).forEach((o) => {
        text += `• \`${o.orderNumber}\` — ₹${Number(o.grandTotal).toLocaleString('en-IN')} (${o.paymentMethod || 'PAID'})\n`;
      });
    }

    await this.sendMessage(chatId, text);
  }

  private async replyOnlineSummary(chatId: string): Promise<void> {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );
    const endOfToday = new Date(startOfToday.getTime() + 86400000);

    const orders = await this.prisma.order.findMany({
      where: {
        channel: { not: 'POS_SHOPORA' },
        createdAt: { gte: startOfToday, lt: endOfToday },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        customer: { include: { user: true } },
      },
    });

    const activeOrders = orders.filter(
      (o) => !['CANCELLED', 'RETURNED', 'REFUNDED'].includes(o.status),
    );
    const totalRev = activeOrders.reduce(
      (sum, o) => sum + Number(o.grandTotal || 0),
      0,
    );

    let text = `🛍️ *TODAY'S ONLINE STORE ORDERS*\n━━━━━━━━━━━━━━━━━━━━\n💰 *Total Online Revenue:* ₹${totalRev.toLocaleString('en-IN')}\n📦 *Total Orders:* ${activeOrders.length}\n\n`;

    if (orders.length === 0) {
      text += `_No online orders received today yet._`;
    } else {
      text += `*Recent Orders:*\n`;
      orders.slice(0, 5).forEach((o) => {
        const custName = o.customer?.user
          ? `${o.customer.user.firstName} ${o.customer.user.lastName || ''}`.trim()
          : 'Customer';
        text += `• \`${o.orderNumber}\` (${custName}) — ₹${Number(o.grandTotal).toLocaleString('en-IN')} [${o.status}]\n`;
      });
    }

    await this.sendMessage(chatId, text);
  }

  private async replyLowStock(chatId: string): Promise<void> {
    const invItems = await this.prisma.inventory.findMany({
      where: { availableQuantity: { lte: 5 } },
      include: {
        variant: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
      orderBy: { availableQuantity: 'asc' },
      take: 10,
    });

    let text = `⚠️ *LOW STOCK INVENTORY REPORT*\n━━━━━━━━━━━━━━━━━━━━\n`;
    if (invItems.length === 0) {
      text += `✅ All products have healthy stock levels!`;
    } else {
      invItems.forEach((item) => {
        const prodName = item.variant?.product?.name || 'Product';
        const title =
          item.variant?.title && item.variant.title !== 'Default'
            ? ` (${item.variant.title})`
            : '';
        const sku = item.variant?.sku || 'SKU-N/A';
        text += `• *${prodName}${title}*\n  SKU: \`${sku}\` | Left: *${item.availableQuantity} units*\n`;
      });
    }

    await this.sendMessage(chatId, text);
  }

  private async replyRecentOrders(chatId: string): Promise<void> {
    const orders = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        customer: { include: { user: true } },
      },
    });

    let text = `📦 *RECENT 5 ORDERS*\n━━━━━━━━━━━━━━━━━━━━\n`;
    if (orders.length === 0) {
      text += `_No orders found._`;
    } else {
      orders.forEach((o) => {
        const type = o.channel === 'POS_SHOPORA' ? '🏪 POS' : '🌐 Online';
        const dateStr = new Date(o.createdAt).toLocaleDateString('en-IN', {
          timeZone: 'Asia/Kolkata',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        text += `• *${o.orderNumber}* (${type})\n  ₹${Number(o.grandTotal).toLocaleString('en-IN')} | *${o.status}* | ${dateStr}\n`;
      });
    }

    await this.sendMessage(chatId, text);
  }

  async testNotification(): Promise<{ success: boolean; message: string }> {
    const config = this.cachedConfig || (await this.loadConfig());
    if (!config.botToken) {
      return { success: false, message: 'Bot token not configured.' };
    }
    if (!config.allowedChatIds?.length) {
      return { success: false, message: 'No allowed Chat IDs configured.' };
    }

    const testMsg = `🚀 *VASANTHI DESIGNERS TELEGRAM AUTOMATION ACTIVE!*\n━━━━━━━━━━━━━━━━━━━━\n✅ Your Telegram Bot integration is working perfectly.\n⏰ *Time:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n\n_You will receive instant alerts for new online orders and POS sales._`;

    let sentCount = 0;
    for (const chatId of config.allowedChatIds) {
      const ok = await this.sendMessage(chatId, testMsg);
      if (ok) sentCount++;
    }

    return {
      success: sentCount > 0,
      message: `Test alert sent to ${sentCount}/${config.allowedChatIds.length} recipient(s).`,
    };
  }

  async setupWebhook(publicBaseUrl: string): Promise<any> {
    const config = this.cachedConfig || (await this.loadConfig());
    const webhookUrl = `${publicBaseUrl.replace(/\/$/, '')}/api/v1/telegram/webhook`;
    const apiUrl = `https://api.telegram.org/bot${config.botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;

    try {
      const res = await axios.get(apiUrl);
      this.logger.log(`Telegram webhook registered to: ${webhookUrl}`);
      return res.data;
    } catch (err: any) {
      this.logger.error(
        `Failed to set Telegram webhook: ${err.response?.data?.description || err.message}`,
      );
      throw err;
    }
  }
}
