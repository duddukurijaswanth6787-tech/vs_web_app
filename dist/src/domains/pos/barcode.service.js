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
var BarcodeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BarcodeService = void 0;
const common_1 = require("@nestjs/common");
const bwipjs = __importStar(require("bwip-js"));
let BarcodeService = BarcodeService_1 = class BarcodeService {
    logger = new common_1.Logger(BarcodeService_1.name);
    async generateBarcodeBuffer(text, bcid = 'code128', scale = 2, height = 10) {
        try {
            const pngBuffer = await bwipjs.toBuffer({
                bcid,
                text,
                scale,
                height,
                includetext: true,
                textxalign: 'center',
                textsize: 8,
            });
            return pngBuffer;
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            this.logger.error(`Failed to generate barcode for ${text}: ${errorMessage}`);
            throw new common_1.InternalServerErrorException(`Barcode generation error: ${errorMessage}`);
        }
    }
    async generateBarcodeDataUrl(text, bcid = 'code128', scale = 2, height = 10) {
        const buffer = await this.generateBarcodeBuffer(text, bcid, scale, height);
        return `data:image/png;base64,${buffer.toString('base64')}`;
    }
    async generateQrCodeDataUrl(text) {
        const buffer = await bwipjs.toBuffer({
            bcid: 'qrcode',
            text,
            scale: 3,
        });
        return `data:image/png;base64,${buffer.toString('base64')}`;
    }
    LABEL_SPECS = {
        SMALL: {
            pageWidthMm: 50,
            pageHeightMm: 25,
            contentWidthMm: 44,
            contentHeightMm: 21,
            includeQr: false,
            layout: 'compact',
        },
        MEDIUM: {
            pageWidthMm: 75,
            pageHeightMm: 40,
            contentWidthMm: 69,
            contentHeightMm: 34,
            includeQr: true,
            layout: 'compact',
        },
        LARGE: {
            pageWidthMm: 100,
            pageHeightMm: 50,
            contentWidthMm: 94,
            contentHeightMm: 44,
            includeQr: true,
            layout: 'branded',
        },
    };
    buildStickerBodyHtml(params, labelSize, barcodeDataUrl, qrDataUrl) {
        const store = params.storeName || 'VASANTHI DESIGNERS';
        const variantStr = params.variantTitle ? ` | ${params.variantTitle}` : '';
        const spec = this.LABEL_SPECS[labelSize];
        const maxTitleChars = spec.layout === 'branded' ? 34 : 22;
        const rawTitle = `${params.productName}${variantStr}`;
        const title = rawTitle.length > maxTitleChars
            ? `${rawTitle.slice(0, maxTitleChars - 1).trimEnd()}…`
            : rawTitle;
        if (spec.layout === 'branded') {
            return `
  <div class="brand-mark">❖</div>
  <div class="store-name">${store}</div>
  <div class="hr"></div>
  <div class="product-title">${title}</div>
  <div class="sku-pill">${params.sku}</div>
  <div class="code-row">
    <div class="barcode-col">
      <img src="${barcodeDataUrl}" class="barcode-img" alt="${params.barcode}" />
      <div class="barcode-text">${params.sku}</div>
    </div>
    ${qrDataUrl ? `<div class="v-divider"></div><div class="qr-col"><img src="${qrDataUrl}" class="qr-img" alt="QR ${params.barcode}" /></div>` : ''}
  </div>
  <div class="hr"></div>
  <div class="price-row">₹${params.price}</div>`;
        }
        return `
  <div class="store-name">${store}</div>
  <div class="product-title">${title}</div>
  <div class="code-row">
    <img src="${barcodeDataUrl}" class="barcode-img" alt="${params.barcode}" />
    ${qrDataUrl ? `<img src="${qrDataUrl}" class="qr-img" alt="QR ${params.barcode}" />` : ''}
  </div>
  <div class="footer-row">
    <span class="sku">${params.sku}</span>
    <span class="price">₹${params.price}</span>
  </div>`;
    }
    buildStickerCss(labelSize, forPreview) {
        const spec = this.LABEL_SPECS[labelSize];
        const border = forPreview ? 'border: 1px dashed #ccc;' : '';
        if (spec.layout === 'branded') {
            return `
    .sticker-page {
      padding: 2mm 4mm;
      width: ${spec.contentWidthMm}mm;
      height: ${spec.contentHeightMm}mm;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      text-align: center;
      background: #ffffff;
      color: #000000;
      font-family: 'Helvetica Neue', Arial, sans-serif;
      border-radius: 3mm;
      border: 1.5px dashed #333333;
      ${forPreview ? '' : border}
    }
    .brand-mark { font-size: 10px; color: #0284c7; line-height: 1; }
    .store-name {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.3px;
      line-height: 1.2;
    }
    .hr { width: 90%; height: 1px; background: #d4d4d4; margin: 1mm 0; flex-shrink: 0; }
    .product-title {
      font-size: 9px;
      font-weight: 600;
      color: #333333;
      white-space: nowrap;
      max-width: 100%;
      line-height: 1.2;
    }
    .sku-pill {
      background: #111111;
      color: #ffffff;
      font-weight: 800;
      font-size: 11px;
      letter-spacing: 0.5px;
      padding: 1mm 3mm;
      border-radius: 1.5mm;
      margin: 1mm 0;
      line-height: 1.4;
      flex-shrink: 0;
    }
    .code-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 3mm;
      width: 100%;
      flex-shrink: 0;
    }
    .barcode-col { display: flex; flex-direction: column; align-items: center; }
    .barcode-img { height: 11mm; object-fit: contain; }
    .barcode-text { font-family: monospace; font-size: 7px; margin-top: 0.5mm; line-height: 1; }
    .v-divider { width: 1px; height: 14mm; border-left: 1px dashed #cccccc; }
    .qr-col { display: flex; align-items: center; }
    .qr-img { width: 14mm; height: 14mm; object-fit: contain; }
    .price-row { font-size: 16px; font-weight: 900; line-height: 1.2; flex-shrink: 0; }
      `;
        }
        return `
    .sticker-page {
      padding: 2mm 3mm;
      width: ${spec.contentWidthMm}mm;
      height: ${spec.contentHeightMm}mm;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      text-align: center;
      background: #ffffff;
      color: #000000;
      font-family: 'Helvetica Neue', Arial, sans-serif;
      ${border}
    }
    .store-name {
      font-size: ${labelSize === 'MEDIUM' ? 8 : 7}px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      line-height: 1;
    }
    .product-title {
      font-size: ${labelSize === 'MEDIUM' ? 9 : 8}px;
      font-weight: 700;
      white-space: nowrap;
      max-width: 100%;
      line-height: 1.1;
      margin-top: 1px;
    }
    .code-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2mm;
      flex: 1;
      width: 100%;
    }
    .barcode-img { max-width: 100%; height: ${labelSize === 'MEDIUM' ? 12 : 10}mm; object-fit: contain; }
    .qr-img { height: 12mm; width: 12mm; object-fit: contain; }
    .footer-row {
      display: flex;
      justify-content: space-between;
      width: 100%;
      font-size: ${labelSize === 'MEDIUM' ? 9 : 8}px;
      font-weight: 800;
      line-height: 1;
    }
    .sku { font-family: monospace; font-size: ${labelSize === 'MEDIUM' ? 8 : 7}px; }
    .price { font-size: ${labelSize === 'MEDIUM' ? 11 : 9}px; font-weight: 900; }
    `;
    }
    async generateSingleStickerLabelHtml(params, labelSize = 'SMALL') {
        const spec = this.LABEL_SPECS[labelSize];
        const barcodeDataUrl = await this.generateBarcodeDataUrl(params.barcode, 'code128', 2, 10);
        const qrDataUrl = spec.includeQr
            ? await this.generateQrCodeDataUrl(params.barcode)
            : null;
        const bodyHtml = this.buildStickerBodyHtml(params, labelSize, barcodeDataUrl, qrDataUrl);
        const css = this.buildStickerCss(labelSize, false);
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page {
      size: ${spec.pageWidthMm}mm ${spec.pageHeightMm}mm;
      margin: 0;
    }
    body {
      margin: 0;
      display: flex;
      justify-content: center;
    }
    ${css}
  </style>
</head>
<body>
  <div class="sticker-page">${bodyHtml}</div>
</body>
</html>
    `.trim();
    }
    async generateBatchStickersHtml(dto) {
        const labelSize = dto.labelSize || 'SMALL';
        const spec = this.LABEL_SPECS[labelSize];
        const singleLabelHtml = await this.generateSingleStickerLabelHtml({
            storeName: dto.storeName,
            productName: dto.productName,
            variantTitle: dto.variantTitle,
            sku: dto.sku,
            price: dto.price,
            barcode: dto.barcode,
        }, labelSize);
        const match = singleLabelHtml.match(/<div class="sticker-page">([\s\S]*)<\/div>\s*<\/body>/);
        const stickerInner = match ? match[1] : '';
        const stickerPages = Array.from({ length: dto.quantity })
            .map(() => `<div class="sticker-page">${stickerInner}</div>`)
            .join('\n');
        const css = this.buildStickerCss(labelSize, true);
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Batch Label Stickers (${dto.quantity} copies)</title>
  <style>
    @media print {
      @page {
        size: ${spec.pageWidthMm}mm ${spec.pageHeightMm}mm;
        margin: 0;
      }
      body {
        margin: 0;
        padding: 0;
      }
      .sticker-page {
        page-break-after: always;
      }
    }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      background: #f5f5f5;
      padding: 10px;
    }
    .sticker-page { margin: 0 auto 10px auto; }
    ${css}
  </style>
</head>
<body>
  ${stickerPages}
</body>
</html>
    `.trim();
    }
};
exports.BarcodeService = BarcodeService;
exports.BarcodeService = BarcodeService = BarcodeService_1 = __decorate([
    (0, common_1.Injectable)()
], BarcodeService);
//# sourceMappingURL=barcode.service.js.map