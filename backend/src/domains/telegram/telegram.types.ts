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
  ONLINE_ORDER: `🛍️ *NEW ONLINE STORE ORDER*
━━━━━━━━━━━━━━━━━━━━
📦 *Order Ref:* \`{{orderNumber}}\`
🛒 *Channel:* 🌐 Online Web Store
⏰ *Date:* {{createdAt}}

👤 *Customer Details:*
• *Name:* {{customerName}}
• *Phone:* \`{{customerPhone}}\`
• *Delivery:* {{shippingCity}}, {{shippingState}}

👗 *Ordered Items ({{itemsCount}}):*
{{itemsList}}

💰 *Billing Summary:*
• Subtotal: ₹{{subtotal}}
• Discount: -₹{{discountTotal}}
• Delivery: {{shippingCharge}}
• *Grand Total: ₹{{grandTotal}}*

💳 *Payment Details:*
• *Method:* {{paymentMethod}}
• *Status:* *{{paymentStatus}}*
━━━━━━━━━━━━━━━━━━━━
_Live store instant alert._ ✨`,

  ORDER_STATUS_UPDATE: `📦 *ORDER STATUS UPDATE*
━━━━━━━━━━━━━━━━━━━━
🔖 *Order Ref:* \`{{orderNumber}}\`
🏷️ *New Status:* *{{status}}*
👤 *Customer:* {{customerName}}
💰 *Order Amount:* ₹{{grandTotal}}
{{courierInfo}}
{{noteInfo}}
━━━━━━━━━━━━━━━━━━━━
_Live store workflow update._ ✨`,

  POS_SALE: `🧾 *IN-STORE POS SALE*
━━━━━━━━━━━━━━━━━━━━
🏷️ *Bill No:* \`{{billNumber}}\`
🏬 *Channel:* In-Store Counter POS
👤 *Cashier / Staff:* {{cashierName}}
⏰ *Date:* {{createdAt}}

👗 *Items Sold ({{itemsCount}}):*
{{itemsList}}

💰 *Billing Summary:*
• *Grand Total: ₹{{grandTotal}}*
• *Payment Mode:* {{paymentMethod}}
━━━━━━━━━━━━━━━━━━━━
_Live counter sale._ ✨`,

  SHIFT_CLOSE: `🔒 *POS REGISTER SHIFT CLOSED*
━━━━━━━━━━━━━━━━━━━━
🏷️ *Terminal:* \`{{terminalId}}\`
👤 *Cashier:* {{cashierName}}
⏰ *Closed At:* {{closedAt}}

💰 *Revenue Summary:*
• *Total Sales:* ₹{{totalSales}}
• *Bills Completed:* {{ordersCount}}

💵 *Cash Reconciliation:*
• Expected in Drawer: ₹{{cashExpected}}
• Actual Counted Cash: ₹{{cashActual}}
• *Discrepancy:* {{discrepancy}}
━━━━━━━━━━━━━━━━━━━━
_Shift reconciliation report._ ✨`,

  LOW_STOCK: `⚠️ *LOW STOCK INVENTORY ALERT*
━━━━━━━━━━━━━━━━━━━━
👗 *Product:* {{productName}}
🏷️ *SKU:* \`{{sku}}\`
📊 *Remaining Live Stock:* *{{currentStock}} units*
🔴 *Reorder Level / Minimum:* {{threshold}} units

💡 *Action Required:* Please restock sizes in admin catalog.
━━━━━━━━━━━━━━━━━━━━
_Live inventory monitoring._ ✨`,

  DAILY_SUMMARY: `📊 *DAILY BUSINESS SUMMARY*
📅 _{{reportDate}}_
━━━━━━━━━━━━━━━━━━━━
💰 *TOTAL REVENUE:* *₹{{totalRevenue}}*
📦 *TOTAL ORDERS:* *{{totalOrders}}*
👗 *ITEMS SOLD:* *{{itemsSold}} units*

🏢 *Sales Channels Breakdown:*
• 🏬 *In-Store POS:* ₹{{posRevenue}} ({{posOrders}} bills)
• 🌐 *Online Store:* ₹{{onlineRevenue}} ({{onlineOrders}} orders)

⚠️ *Inventory Status:*
• {{lowStockText}}
━━━━━━━━━━━━━━━━━━━━
_Automated executive sales report._ ✨`
};
