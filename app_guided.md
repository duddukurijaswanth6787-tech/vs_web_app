# 📱 Shopora & Vasanthi Designers — Complete Screen & Field User Guide (`app_guided.md`)

This guide provides an **exhaustive, screen-by-screen, and field-by-field reference** for the entire **Shopora Mobile App** and **E-Commerce System**. Store owners and managers can use this document to understand every input field, dropdown, toggle, and feature with real-world examples.

---

## 📋 **Table of Contents**
1. [Sign In Screen (`login.tsx`)](#1-sign-in-screen-logintsx)
2. [Add Product Screen (`add-product.tsx`)](#2-add-product-screen-add-producttsx)
3. [Add Stock & Restock Screen (`add-stock.tsx`)](#3-add-stock--restock-screen-add-stocktsx)
4. [POS Counter Billing Screen (`sale.tsx`)](#4-pos-counter-billing-screen-saletsx)
5. [Customer Profile Edit Screen (`profile/edit/page.tsx`)](#5-customer-profile-edit-screen-profileeditpagetsx)
6. [Checkout & Delivery Screen (`checkout/page.tsx`)](#6-checkout--delivery-screen-checkoutpagetsx)
7. [Order Return Request Screen (`orders/return/page.tsx`)](#7-order-return-request-screen-ordersreturnpagetsx)
8. [Super Admin Feature Flags Screen (`admin/system/feature-flags/page.tsx`)](#8-super-admin-feature-flags-screen-adminsystemfeature-flagspagetsx)

---

## 🔑 **1. Sign In Screen (`login.tsx`)**

This screen is used by staff operators, managers, and customers to authenticate their session.

| Field Name | Type | Purpose & Field Explanation | Real Concrete Example |
| :--- | :--- | :--- | :--- |
| **Email** | Text Input | Email address associated with the staff or customer account. | `admin@vasanthidesigners.com` |
| **Password** | Password | Account security password. | `••••••••` |
| **Sign In Button** | Action Button | Authenticates user and routes staff to POS tools or customers to the storefront. | Tap to Sign In |

---

## 🛍️ **2. Add Product Screen (`add-product.tsx`)**

This screen is used by store catalog managers to register a brand new saree or garment design in the database.

### **A. Basic Product Details**

| Field Name | Type | Purpose & Field Explanation | Real Concrete Example |
| :--- | :--- | :--- | :--- |
| **Product Name** | Text Input | Official title of the garment displayed on website and POS. | `Kanchipuram Silk Saree - Peacock Blue` |
| **Category** | Dropdown | Category department for catalog organization. | `Kanchipuram Silks` |
| **Brand** | Dropdown | Brand or designer label name. | `Vasanthi Signature` |
| **Short Description** | Text Input | Brief 1-line summary highlight for search results. | `Pure Zari Kanchipuram Handloom Silk Saree with Gold Weave` |
| **Full Description** | Multi-line Text | Complete weaving history, fabric care, and blouse details. | `Dry clean only. 100% pure Mulberry silk with certified zari border.` |
| **HSN Tax Code** | Text Input | GST Tax Classification Code. | `5007` (Silk Fabric HSN) |
| **GST Tax Rate (%)** | Dropdown | Applicable tax percentage. | `5%` |

### **B. Pricing Fields**

| Field Name | Type | Purpose & Field Explanation | Real Concrete Example |
| :--- | :--- | :--- | :--- |
| **Retail MRP (₹)** | Number Input | Maximum Retail Price printed on garment price tag. | `₹25,000` |
| **Selling Price (₹)** | Number Input | Final price charged to retail customers after store discount. | `₹19,999` |
| **B2B Wholesale Price (₹)**| Number Input | Special bulk pricing for wholesale B2B business buyers. | `₹15,500` |
| **Cost Price (₹)** | Secret Input | Confidential purchase/weaving cost for profit margin reports. | `₹11,000` |

### **C. Variants, Dimensions & Shipping**

| Field Name | Type | Purpose & Field Explanation | Real Concrete Example |
| :--- | :--- | :--- | :--- |
| **Color Name & Hex** | Swatch Picker | Color label and visual hex swatch code. | `Peacock Blue (#0284c7)` |
| **Garment Size** | Multi-Select | Available clothing sizes or saree dimensions. | `Standard Saree (6.3m with blouse)` |
| **Parcel Weight (kg)** | Number Input | Package net weight for DTDC courier shipping fee calculation. | `0.85 kg` |
| **Parcel Length (cm)** | Number Input | Length of packed saree box. | `35 cm` |
| **Parcel Width (cm)** | Number Input | Width of packed saree box. | `25 cm` |
| **Parcel Height (cm)** | Number Input | Height/thickness of packed saree box. | `6 cm` |

### **D. Restrictions & Controls**

| Field Name | Type | Purpose & Field Explanation | Real Concrete Example |
| :--- | :--- | :--- | :--- |
| **Min Order Quantity** | Number Input | Minimum units required per purchase order. | `1` |
| **Max Order Quantity** | Number Input | Maximum purchase cap per customer. | `5` |
| **Pre-Order Toggle** | Checkbox | Allows customers to place orders when stock is 0. | `Enabled` |
| **Channel Restrictions**| Toggles | Restrict item to *Online Store Only*, *POS Counter Only*, or *Both*.| `Both` |
| **Media Asset Upload** | Image File | Attach up to 5 high-resolution product photos. | `peacock_saree_front.jpg` |

---

## 🔄 **3. Add Stock & Restock Screen (`add-stock.tsx`)**

This screen is used when a new batch of stock arrives for an existing saree SKU.

| Field Name | Type | Purpose & Field Explanation | Real Concrete Example |
| :--- | :--- | :--- | :--- |
| **SKU / Barcode Input** | Text / Scanner | Scan or enter the unique product code. | `KANCHI-PB-001` |
| **Destination Warehouse**| Dropdown | Select physical store location receiving the stock. | `Hyderabad Flagship Store` |
| **Quantity Received** | Number Input | Number of new units received. | `+50 units` |
| **Unit Purchase Cost (₹)**| Number Input | Cost price paid per unit for this shipment batch. | `₹11,200` |
| **Supplier / Weaver** | Text Input | Master weaver or vendor supplier name. | `Kanchi Handloom Weavers Guild` |
| **Inward Notes** | Text Area | Internal shipment batch notes. | `Batch #402 received in good condition` |

---

## 💳 **4. POS Counter Billing Screen (`sale.tsx`)**

This screen is used by store cashiers for fast counter billing.

| Field Name | Type | Purpose & Field Explanation | Real Concrete Example |
| :--- | :--- | :--- | :--- |
| **Barcode Scanner Search**| Search / Scanner| Fast lookup by scanning saree price tag barcode. | `890123456001` |
| **Cart Quantity Buttons** | `+` / `-` Controls | Increase or decrease quantity per line item. | `2 units` |
| **Customer Mobile Number** | Text Input | 10-digit phone number lookup for loyalty account. | `9876543210` |
| **Loyalty Points Toggle** | Toggle Button | Redeem points balance as instant cash discount. | `Redeem 250 pts (-₹250)` |
| **Coupon Code Input** | Text Input | Enter promotional voucher code. | `FESTIVE10` |
| **Payment Method** | Radio Buttons | Select payment method (*Cash, Card, UPI, QR Handoff*). | `Cash` |
| **Cash Tendered (₹)** | Number Input | Cash handed by customer to calculate change due. | `₹20,000` |
| **Change Due (₹)** | Read-Only | Exact change to return to customer. | `₹1` |
| **Thermal Receipt Print** | Action Button | Triggers Bluetooth/WebUSB thermal printer receipt. | Tap to Print Receipt |

---

## 👤 **5. Customer Profile Edit Screen (`profile/edit/page.tsx`)**

This screen is used by customers to configure their personal preferences and B2B GSTIN tax details.

| Field Name | Type | Purpose & Field Explanation | Real Concrete Example |
| :--- | :--- | :--- | :--- |
| **First Name & Last Name**| Text Input | Customer legal full name. | `Priya Sharma` |
| **Phone Number** | Text Input | Primary contact mobile number. | `9876543210` |
| **Gender** | Select | *Male, Female, Other*. | `Female` |
| **Date of Birth** | Date Picker | Date of birth for birthday reward coupons. | `15/08/1994` |
| **Preferred Categories** | Multi-Select Pills| Customer favorite saree styles for personalized feeds. | `Kanchipuram Silks, Banarasi` |
| **Preferred Sizes** | Multi-Select Pills| Preferred clothing sizes. | `M, L` |
| **Preferred Colors** | Multi-Select Pills| Favorite color palette. | `Peacock Blue, Silk Gold` |
| **Target Budget (₹)** | Sliders / Numbers | Minimum and Maximum price filter preferences. | `₹10,000 – ₹50,000` |
| **Company Name** | Text Input | Business name for B2B wholesale orders. | `Priya Boutique Pvt Ltd` |
| **GSTIN Number** | Text Input | 15-digit GST tax registration number for tax invoices. | `36AABCP1234H1Z5` |

---

## 🚚 **6. Checkout & Delivery Screen (`checkout/page.tsx`)**

This screen is used during customer checkout to configure shipping and delivery preferences.

| Field Name | Type | Purpose & Field Explanation | Real Concrete Example |
| :--- | :--- | :--- | :--- |
| **Address Selection** | Card Radio List | Choose saved shipping address. | `Home Address - Jubilee Hills` |
| **Address Type** | Selector | Classify location (*HOME, WORK, OTHER*). | `HOME` |
| **Landmark / Alt Phone** | Text Input | Nearest landmark & secondary contact phone. | `Near Metro Pillar #12, Alt: 9123456789` |
| **Preferred Time Slot** | Radio Options | Preferred courier delivery window. | `Morning (9:00 AM – 12:00 PM)` |
| **Delivery Instructions**| Text Input | Instructions for courier delivery agent. | `Leave with security guard if not home` |
| **Is Gift Packaging** | Checkbox Toggle | Request luxury gift wrapping box. | `Enabled` |
| **Gift Card Message** | Text Area | Personalized message printed on gift card. | `Happy Anniversary Dear Ananya!` |
| **Special Order Notes** | Text Area | Custom tailoring or blouse stitching instructions. | `Please attach extra tassels to pallu` |

---

## ↩️ **7. Order Return Request Screen (`orders/return/page.tsx`)**

This screen is used by customers to initiate a 7-day doorstep return request.

| Field Name | Type | Purpose & Field Explanation | Read Concrete Example |
| :--- | :--- | :--- | :--- |
| **Item Checkboxes** | Selection List | Select specific items from delivered order to return. | `Kanchipuram Silk Saree (Qty: 1)` |
| **Return Reason** | Dropdown | Primary reason for return. | `Defective Weave / Fabric Defect` |
| **Defect Explanation** | Text Area | Detailed description of issue. | `Small thread pulling near pallu border` |
| **Refund Preference** | Select Options | *Wallet Balance, Source Card/UPI, Bank Transfer, Store Credit*. | `Store Credit` |
| **Bank Account Number** | Text Input | Account number for direct bank refund transfer. | `123456789012` |
| **Bank IFSC Code** | Text Input | Bank branch IFSC code. | `HDFC0001234` |
| **Inspection Photo Upload**| Image Upload | Upload photo proof of defective area. | `defect_photo.jpg` |

---

## 🎛️ **8. Super Admin Feature Flags Screen (`admin/system/feature-flags/page.tsx`)**

This master control panel allows the Super Admin to turn features ON or OFF in real time across the website.

| Feature Flag Key | Category | Feature Explanation & Function | Default State |
| :--- | :--- | :--- | :--- |
| **`order_cancellation`** | ORDERS | Allows customers to cancel orders from their history page before shipment. | `ENABLED (ON)` |
| **`wallet_system`** | FINANCE | Enables customer wallet balance, top-up, and instant store credit refunds. | `ENABLED (ON)` |
| **`loyalty_points`** | MARKETING | Enables earning and redeeming loyalty points on purchases. | `ENABLED (ON)` |
| **`product_reviews`** | STOREFRONT | Enables submitting and viewing product reviews with photo attachments. | `ENABLED (ON)` |
| **`order_returns`** | ORDERS | Enables 7-day doorstep return request workflow for delivered orders. | `ENABLED (ON)` |
| **`customer_wishlist`** | STOREFRONT | Allows logged-in customers to save items to their personal wishlist. | `ENABLED (ON)` |
| **`gift_wrapping`** | CHECKOUT | Allows customers to request gift wrapping and custom card messages during checkout. | `ENABLED (ON)` |
| **`b2b_invoicing`** | CHECKOUT | Enables entering company tax details (GSTIN) and wholesale B2B pricing. | `ENABLED (ON)` |
| **`instagram_reels`** | STOREFRONT | Renders the live Instagram Reels carousel on the homepage and video feed. | `ENABLED (ON)` |
| **`ai_chatbot`** | AI | Renders the AI assistant for saree styling and size recommendations. | `ENABLED (ON)` |
