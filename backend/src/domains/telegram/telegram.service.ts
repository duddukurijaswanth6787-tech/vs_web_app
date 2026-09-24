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

export const MAIN_KEYBOARD_MARKUP = {
  keyboard: [
    [{ text: "📊 Today's Summary" }, { text: '📦 Recent Orders' }],
    [{ text: '🧾 POS Sales' }, { text: '🛍️ Online Orders' }],
    [{ text: '💳 Recent Payments' }, { text: '⚠️ Low Stock' }],
  ],
  resize_keyboard: true,
  is_persistent: true,
};

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
    // Register official Telegram command list in background
    this.registerBotCommands().catch(() => {});
  }

  async registerBotCommands(): Promise<boolean> {
    const config = this.cachedConfig || (await this.loadConfig());
    if (!config.botToken) return false;

    try {
      const url = `https://api.telegram.org/bot${config.botToken}/setMyCommands`;
      const commands = [
        { command: 'today', description: "Today's sales, revenue & orders summary" },
        { command: 'payments', description: 'Recent 5 customer payments & sources' },
        { command: 'orders', description: 'Recent 5 store customer orders' },
        { command: 'pos', description: "Today's in-store POS sales & bills" },
        { command: 'online', description: "Today's online store orders" },
        { command: 'stock', description: 'Low stock inventory alerts' },
        { command: 'help', description: 'Show all features & command menu' },
      ];
      const res = await axios.post(url, { commands }, { timeout: 8000 });
      this.logger.log(`Telegram Bot commands menu registered successfully: ${res.data?.ok}`);
      return res.data?.ok === true;
    } catch (err: any) {
      this.logger.warn(`Could not register Telegram bot commands: ${err.message}`);
      return false;
    }
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
    replyMarkup: any = MAIN_KEYBOARD_MARKUP,
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
          reply_markup: replyMarkup || MAIN_KEYBOARD_MARKUP,
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
              reply_markup: replyMarkup || MAIN_KEYBOARD_MARKUP,
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
    const lower = text.toLowerCase();

    // 🆔 Allow any user to check their own Telegram ID
    if (lower === '/myid' || lower === '/id') {
      await this.sendMessage(
        senderId,
        `🆔 *Your Telegram User ID:* \`${senderId}\`\n\n_To get access to Vasanthi Designers store bot, share this ID with the Super Administrator._`,
        'Markdown',
        { remove_keyboard: true },
      );
      return;
    }

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
        `⛔ *Access Denied*\n\nYour Telegram User ID (\`${senderId}\`) is not authorized to access Vasanthi Designers store management.\n\n_Share this ID with the Super Administrator to grant access._`,
        'Markdown',
        { remove_keyboard: true },
      );
      return;
    }

    // 👥 Admin Management Commands (Accessible by authorized users)
    if (
      lower.startsWith('/addadmin') ||
      lower.startsWith('/adduser') ||
      lower.startsWith('/whitelist')
    ) {
      const parts = text.split(/\s+/);
      const newId = parts[1]?.trim();
      if (!newId || !/^\d+$/.test(newId)) {
        await this.sendMessage(
          senderId,
          `⚠️ *Invalid Format*\n\nPlease provide a numeric Telegram User ID:\n• \`/addadmin 123456789\``,
        );
        return;
      }

      const currentList = config.allowedChatIds || [];
      if (!currentList.includes(newId)) {
        const updatedList = [...currentList, newId];
        await this.updateSettings({ allowedChatIds: updatedList });
        await this.sendMessage(
          senderId,
          `✅ *User Authorized Successfully!*\n━━━━━━━━━━━━━━━━━━━━\nTelegram User ID: \`${newId}\` has been granted access to Vasanthi Designers bot.\n\n_They can now use the bot and receive instant real-time alerts._`,
        );
        // Send a welcome message with keyboard to the newly authorized user
        await this.sendMessage(
          newId,
          `👑 *Welcome to Vasanthi Designers Store Bot!*\n━━━━━━━━━━━━━━━━━━━━\nYou have been granted administrator access to store management & real-time alerts.\n\n_Tap any quick menu button below to begin!_`,
          'Markdown',
          MAIN_KEYBOARD_MARKUP,
        );
      } else {
        await this.sendMessage(
          senderId,
          `ℹ️ Telegram User ID \`${newId}\` is already authorized.`,
        );
      }
      return;
    }

    if (lower.startsWith('/removeadmin') || lower.startsWith('/removeuser')) {
      const parts = text.split(/\s+/);
      const targetId = parts[1]?.trim();
      if (!targetId) {
        await this.sendMessage(
          senderId,
          `⚠️ Please specify a User ID to remove:\n• \`/removeadmin <id>\``,
        );
        return;
      }
      const updatedList = (config.allowedChatIds || []).filter(
        (id) => id !== targetId,
      );
      await this.updateSettings({ allowedChatIds: updatedList });
      await this.sendMessage(
        senderId,
        `🗑️ *User Access Revoked*\n\nTelegram User ID \`${targetId}\` has been removed from authorized users.`,
      );
      return;
    }

    if (lower === '/admins' || lower === '/users') {
      const ids = config.allowedChatIds || [];
      let msg = `👥 *AUTHORIZED TELEGRAM USERS (${ids.length})*\n━━━━━━━━━━━━━━━━━━━━\n`;
      ids.forEach((id, idx) => {
        msg += `${idx + 1}. \`${id}\`${id === senderId ? ' _(You)_' : ''}\n`;
      });
      msg += `\n💡 *To authorize a client or partner:*\nSend \`/addadmin <Telegram_User_ID>\`\n_(They can get their ID by sending \`/myid\` to this bot)_`;
      await this.sendMessage(senderId, msg);
      return;
    }

    // 1. Check if user mentioned an Order Number (e.g. ORD-..., POS-..., VAS-..., or UUID)
    const orderMatch = text.match(
      /((?:ORD|POS|VAS)-[A-Z0-9-]+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
    );

    if (lower === '/start' || lower === '/help') {
      await this.sendMessage(
        senderId,
        `👑 *Welcome to Vasanthi Designers Store Bot!*\n━━━━━━━━━━━━━━━━━━━━\nHello *${message.from?.first_name || 'Admin'}*, you are connected to the live store management system.\n\n*Tap any button below or ask in plain English:*\n• \`/today\` — Today's full business summary & revenue\n• \`/payments\` — Recent customer payments & sources\n• \`/orders\` — Recent store customer orders\n• \`/pos\` — Today's in-store POS sales report\n• \`/online\` — Today's online store orders\n• \`/stock\` — Low stock inventory alerts\n• \`/admins\` — Manage authorized bot users\n• \`/test\` — Ping test live bot connection\n\n💡 *Smart Actions:*\n• Type or paste any Order Number (e.g. \`ORD-ONL-20260923-0001\`)\n• Ask natural questions: _"give order full detail"_, _"today's sale"_, _"pos report"_\n• Add another admin user: \`/addadmin <User_ID>\`\n• Instant real-time alerts for online orders and POS sales ⚡`,
      );
      return;
    }

    if (
      lower === '/today' ||
      lower === '/sales' ||
      text.includes("Today's Summary") ||
      text.includes('Refresh')
    ) {
      await this.replyTodaySummary(senderId);
      return;
    }

    if (lower === '/orders' || text.includes('Recent Orders')) {
      await this.replyRecentOrders(senderId);
      return;
    }

    if (lower === '/pos' || text.includes('POS Sales')) {
      await this.replyPosSummary(senderId);
      return;
    }

    if (lower === '/online' || text.includes('Online Orders')) {
      await this.replyOnlineSummary(senderId);
      return;
    }

    if (
      lower === '/payments' ||
      lower === '/pay' ||
      text.includes('Recent Payments') ||
      text.includes('Payments')
    ) {
      await this.replyRecentPayments(senderId);
      return;
    }

    if (lower === '/stock' || lower === '/lowstock' || text.includes('Low Stock')) {
      await this.replyLowStock(senderId);
      return;
    }

    if (lower === '/test') {
      await this.sendMessage(
        senderId,
        `✅ *Connection Healthy!*\n━━━━━━━━━━━━━━━━━━━━\n• *Status:* Online & Active\n• *Server Time:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n• *Authorized ID:* \`${senderId}\``,
      );
      return;
    }

    // 2. If explicit order number was found in message
    if (orderMatch) {
      await this.replyOrderDetails(senderId, orderMatch[1]);
      return;
    }

    // 3. Natural language query: Order details / Full detail
    if (
      lower.includes('order detail') ||
      lower.includes('order details') ||
      lower.includes('full detail') ||
      lower.includes('order info') ||
      lower.includes('order status') ||
      lower.includes('track order') ||
      lower.includes('about the order') ||
      (lower.includes('order') && lower.includes('detail')) ||
      (lower.includes('give') && lower.includes('detail'))
    ) {
      await this.replyOrderDetails(senderId, null);
      return;
    }

    // 4. Natural language query: Recent orders
    if (
      lower.includes('recent order') ||
      lower.includes('last order') ||
      lower.includes('show order') ||
      lower.includes('all order') ||
      lower.includes('orders')
    ) {
      await this.replyRecentOrders(senderId);
      return;
    }

    // 5. Natural language query: Payments & Transactions
    if (
      lower.includes('payment') ||
      lower.includes('transaction') ||
      lower.includes('upi') ||
      lower.includes('razorpay') ||
      lower.includes('collection') ||
      lower.includes('cash collection')
    ) {
      await this.replyRecentPayments(senderId);
      return;
    }

    // 6. Natural language query: POS
    if (
      lower.includes('pos') ||
      lower.includes('in-store') ||
      lower.includes('instore') ||
      lower.includes('counter') ||
      lower.includes('bill')
    ) {
      await this.replyPosSummary(senderId);
      return;
    }

    // 7. Natural language query: Online Store
    if (
      lower.includes('online') ||
      lower.includes('web') ||
      lower.includes('website') ||
      lower.includes('ecommerce') ||
      lower.includes('ecom')
    ) {
      await this.replyOnlineSummary(senderId);
      return;
    }

    // 8. Natural language query: Low stock / Inventory
    if (
      lower.includes('stock') ||
      lower.includes('inventory') ||
      lower.includes('quantity') ||
      lower.includes('left')
    ) {
      await this.replyLowStock(senderId);
      return;
    }

    // 9. Natural language query: Today / Sales / Revenue
    if (
      lower.includes('today') ||
      lower.includes('sale') ||
      lower.includes('revenue') ||
      lower.includes('earning') ||
      lower.includes('income') ||
      lower.includes('how much')
    ) {
      await this.replyTodaySummary(senderId);
      return;
    }

    await this.sendMessage(
      senderId,
      `❓ I didn't quite catch that. You can:\n• Tap any quick menu button below\n• Paste an Order Number (e.g. \`ORD-ONL-20260923-0001\`)\n• Ask questions like _"give order full detail"_, _"today's sale"_, _"pos report"_\n• Type \`/help\` to see all commands`,
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
        items: { select: { productName: true, quantity: true } },
      },
    });

    let text = `📦 *RECENT STORE ORDERS (${orders.length})*\n━━━━━━━━━━━━━━━━━━━━\n`;
    if (orders.length === 0) {
      text += `_No orders found in the database yet._`;
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
        const custName = o.customer?.user
          ? `${o.customer.user.firstName} ${o.customer.user.lastName || ''}`.trim()
          : 'Customer';
        const itemsSummary = o.items
          .map((i) => `${i.productName} (x${i.quantity})`)
          .join(', ');

        text += `• *\`${o.orderNumber}\`* (${type})\n  👤 ${custName} | *₹${Number(o.grandTotal).toLocaleString('en-IN')}* | [${o.status}]\n  🛍️ _${itemsSummary || 'Items'}_ | ⏰ ${dateStr}\n\n`;
      });
      text += `_Send any Order Number (e.g. \`${orders[0].orderNumber}\`) to view full details._`;
    }

    await this.sendMessage(chatId, text);
  }

  private async replyOrderDetails(
    chatId: string,
    orderQuery?: string | null,
  ): Promise<void> {
    let order: any = null;

    if (orderQuery && orderQuery.trim()) {
      const q = orderQuery.trim();
      order = await this.prisma.order.findFirst({
        where: {
          OR: [
            { orderNumber: { equals: q, mode: 'insensitive' } },
            { orderNumber: { contains: q, mode: 'insensitive' } },
            { id: q },
          ],
        },
        include: {
          customer: { include: { user: true } },
          items: true,
          addresses: true,
          payments: { orderBy: { createdAt: 'desc' } },
        },
      });
    } else {
      // Find latest order in database
      order = await this.prisma.order.findFirst({
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { include: { user: true } },
          items: true,
          addresses: true,
          payments: { orderBy: { createdAt: 'desc' } },
        },
      });
    }

    if (!order) {
      await this.sendMessage(
        chatId,
        `🔍 *Order Not Found*\n━━━━━━━━━━━━━━━━━━━━\nCould not find any order matching \`${orderQuery || ''}\`.\n\n_Tip: Send a valid Order Number like \`ORD-ONL-20260923-0001\` or tap *📦 Recent Orders*._`,
      );
      return;
    }

    const isPos = order.channel === 'POS_SHOPORA';
    const channelName = isPos ? '🏪 In-Store Shopora POS' : '🌐 Online Web Store';
    const dateStr = new Date(order.createdAt).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const custUser = order.customer?.user;
    const shippingAddr =
      (order.addresses || []).find((a: any) => a.addressType === 'SHIPPING') ||
      order.addresses?.[0];

    let custText = `👤 *Customer Details:*\n`;
    if (custUser) {
      custText += `• *Name:* ${custUser.firstName} ${custUser.lastName || ''}\n`;
      if (custUser.phone) custText += `• *Phone:* \`${custUser.phone}\`\n`;
      if (custUser.email) custText += `• *Email:* \`${custUser.email}\`\n`;
    } else if (shippingAddr?.fullName) {
      custText += `• *Name:* ${shippingAddr.fullName}\n`;
      if (shippingAddr.phone) custText += `• *Phone:* \`${shippingAddr.phone}\`\n`;
    } else {
      custText += `• *Customer:* Walk-in / Guest\n`;
    }

    let addrText = '';
    if (shippingAddr && !isPos) {
      const parts = [
        shippingAddr.addressLine1,
        shippingAddr.addressLine2,
        shippingAddr.city,
        shippingAddr.state,
        shippingAddr.postalCode,
      ].filter(Boolean);
      if (parts.length > 0) {
        addrText = `📍 *Shipping Address:*\n${parts.join(', ')}\n\n`;
      }
    }

    let itemsText = `🛍️ *Order Items (${order.items?.length || 0}):*\n`;
    (order.items || []).forEach((item: any, idx: number) => {
      const variant =
        item.variantTitle && item.variantTitle !== 'Default'
          ? ` [${item.variantTitle}]`
          : '';
      const unitP = Number(item.unitPrice || item.price || 0).toLocaleString('en-IN');
      const totalP = Number(item.totalPrice || item.total || 0).toLocaleString('en-IN');
      itemsText += `${idx + 1}. *${item.productName}*${variant}\n   Qty: *${item.quantity}* × ₹${unitP} = *₹${totalP}*\n`;
    });

    const payment = order.payments?.[0];
    const payStatus = payment?.status || (isPos ? 'COMPLETED' : 'PENDING');
    const payMethod = payment?.method || order.paymentMethod || 'N/A';
    let payMeta = '';
    if (payment?.metadata && typeof payment.metadata === 'object') {
      const meta: any = payment.metadata;
      if (meta.vpa) payMeta += `\n• *UPI ID:* \`${meta.vpa}\``;
      if (meta.rrn) payMeta += `\n• *Bank RRN:* \`${meta.rrn}\``;
      if (meta.razorpayPaymentId) payMeta += `\n• *Payment ID:* \`${meta.razorpayPaymentId}\``;
    }

    const text = `📦 *ORDER DETAILS: \`${order.orderNumber}\`*\n━━━━━━━━━━━━━━━━━━━━\n🛒 *Channel:* ${channelName}\n🏷️ *Status:* *${order.status}*\n⏰ *Date:* ${dateStr}\n\n${custText}\n${addrText}${itemsText}\n💰 *Financial Breakdown:*\n• Subtotal: ₹${Number(order.subtotal || order.grandTotal).toLocaleString('en-IN')}\n• Discount: -₹${Number(order.discountTotal || 0).toLocaleString('en-IN')}\n• Shipping: ₹${Number(order.shippingFee || 0).toLocaleString('en-IN')}\n• *Grand Total: ₹${Number(order.grandTotal).toLocaleString('en-IN')}*\n\n💳 *Payment Details:*\n• *Method:* ${payMethod} (*${payStatus}*)${payMeta}\n\n_Tip: To look up another order, just type or paste the Order Number._`;

    await this.sendMessage(chatId, text);
  }

  private async replyRecentPayments(chatId: string): Promise<void> {
    const payments = await this.prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          include: {
            customer: { include: { user: true } },
            addresses: true,
          },
        },
      },
    });

    let text = `💳 *RECENT 5 PAYMENTS*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
    if (payments.length === 0) {
      text += `_No payment transactions recorded in database yet._\n\n`;
    } else {
      payments.forEach((p: any, idx: number) => {
        const isPos = p.order?.channel === 'POS_SHOPORA';
        const sourceIcon = isPos ? '🏪 In-Store POS' : '🌐 Online Store';
        const user = p.order?.customer?.user;
        const shipping = (p.order?.addresses || []).find(
          (a: any) => a.addressType === 'SHIPPING',
        );
        const custName = user
          ? `${user.firstName} ${user.lastName || ''}`.trim()
          : (shipping?.fullName || 'Walk-in Customer');
        const phone = user?.phone || shipping?.phone;

        const dateStr = new Date(p.createdAt).toLocaleDateString('en-IN', {
          timeZone: 'Asia/Kolkata',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        const statusEmoji =
          p.status === 'CAPTURED' || p.status === 'COMPLETED' || p.status === 'PAID'
            ? '✅'
            : '⏳';

        text += `${idx + 1}. ${statusEmoji} *₹${Number(p.amount).toLocaleString('en-IN')}* — *${p.method}*\n`;
        text += `   • *Source:* ${sourceIcon}\n`;
        text += `   • *Customer:* ${custName}${phone ? ` (\`${phone}\`)` : ''}\n`;
        text += `   • *Order:* \`${p.order?.orderNumber || 'N/A'}\` [${p.status}]\n`;
        if (p.metadata && typeof p.metadata === 'object') {
          const m: any = p.metadata;
          if (m.vpa) text += `   • *UPI ID:* \`${m.vpa}\`\n`;
          if (m.rrn) text += `   • *Bank RRN:* \`${m.rrn}\`\n`;
          if (m.razorpayPaymentId) text += `   • *Txn ID:* \`${m.razorpayPaymentId}\`\n`;
        }
        text += `   • *Time:* ${dateStr}\n\n`;
      });
    }
    text += `💡 _Send any Order Number (e.g. \`ORD-ONL-20260923-0001\`) to inspect full invoice details._`;

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
      // Also register commands
      await this.registerBotCommands();
      return res.data;
    } catch (err: any) {
      this.logger.error(
        `Failed to set Telegram webhook: ${err.response?.data?.description || err.message}`,
      );
      throw err;
    }
  }
}
