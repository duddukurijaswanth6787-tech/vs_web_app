export interface TelegramConfig {
  botToken: string;
  allowedChatIds: string[];
  enabled: boolean;
  notifyOnOnlineOrder: boolean;
  notifyOnPosSale: boolean;
  notifyOnShiftClose: boolean;
  notifyOnLowStock: boolean;
  templates: Record<string, string>;
}

export interface UpdateTelegramSettingsDto {
  botToken?: string;
  allowedChatIds?: string[];
  enabled?: boolean;
  notifyOnOnlineOrder?: boolean;
  notifyOnPosSale?: boolean;
  notifyOnShiftClose?: boolean;
  notifyOnLowStock?: boolean;
  templates?: Record<string, string>;
}

export interface TelegramWebhookUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    chat: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      type: string;
    };
    date: number;
    text?: string;
  };
}

export const DEFAULT_TELEGRAM_TEMPLATES: Record<string, string> = {
  ONLINE_ORDER: `🛍️ *NEW ONLINE ORDER RECEIVED!*
━━━━━━━━━━━━━━━━━━━━
📦 *Order:* \`{{orderNumber}}\`
👤 *Customer:* {{customerName}} ({{customerPhone}})
📍 *Location:* {{shippingCity}}, {{shippingState}}
💰 *Grand Total:* ₹{{grandTotal}}
💳 *Payment:* {{paymentMethod}} ({{paymentStatus}})

👗 *Items ({{itemsCount}}):*
{{itemsList}}

⏰ *Time:* {{createdAt}}`,

  POS_SALE: `🧾 *NEW IN-STORE POS SALE!*
━━━━━━━━━━━━━━━━━━━━
🏷️ *Bill No:* \`{{billNumber}}\`
👤 *Cashier:* {{cashierName}}
💳 *Payment Mode:* {{paymentMethod}}
💰 *Grand Total:* ₹{{grandTotal}}

📦 *Items Sold ({{itemsCount}}):*
{{itemsList}}

⏰ *Time:* {{createdAt}}`,

  SHIFT_CLOSE: `🔒 *POS REGISTER SHIFT CLOSED*
━━━━━━━━━━━━━━━━━━━━
🏷️ *Terminal:* {{terminalId}}
👤 *Cashier:* {{cashierName}}
💰 *Total Sales:* ₹{{totalSales}} ({{ordersCount}} bills)
💵 *Cash Expected:* ₹{{cashExpected}} | *Actual:* ₹{{cashActual}}
⚖️ *Discrepancy:* ₹{{discrepancy}}
⏰ *Closed At:* {{closedAt}}`,

  LOW_STOCK: `⚠️ *LOW STOCK ALERT!*
━━━━━━━━━━━━━━━━━━━━
👗 *Product:* {{productName}}
🏷️ *SKU:* \`{{sku}}\`
📊 *Remaining Stock:* *{{currentStock}} units*
🔴 *Threshold:* {{threshold}} units`,

  DAILY_SUMMARY: `📊 *BUSINESS SUMMARY ({{reportDate}})*
━━━━━━━━━━━━━━━━━━━━
💰 *Total Revenue:* ₹{{totalRevenue}}
📦 *Total Orders:* {{totalOrders}}
👕 *Items Sold:* {{itemsSold}} Pcs

💵 *Channel Breakdown:*
• *In-Store POS:* ₹{{posRevenue}} ({{posOrders}} bills)
• *Online Store:* ₹{{onlineRevenue}} ({{onlineOrders}} orders)

⚠️ *Low Stock Products:* {{lowStockCount}} items`
};
