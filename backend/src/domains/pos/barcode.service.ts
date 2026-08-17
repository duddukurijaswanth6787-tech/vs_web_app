import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bwipjs from 'bwip-js';
import { GenerateBatchStickersDto, LabelSize } from './pos.types';

@Injectable()
export class BarcodeService {
  private readonly logger = new Logger(BarcodeService.name);

  async generateBarcodeBuffer(
    text: string,
    bcid = 'code128',
    scale = 2,
    height = 10,
  ): Promise<Buffer> {
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to generate barcode for ${text}: ${errorMessage}`,
      );
      throw new InternalServerErrorException(
        `Barcode generation error: ${errorMessage}`,
      );
    }
  }

  async generateBarcodeDataUrl(
    text: string,
    bcid = 'code128',
    scale = 2,
    height = 10,
  ): Promise<string> {
    const buffer = await this.generateBarcodeBuffer(text, bcid, scale, height);
    return `data:image/png;base64,${buffer.toString('base64')}`;
  }

  async generateQrCodeDataUrl(text: string): Promise<string> {
    const buffer = await bwipjs.toBuffer({
      bcid: 'qrcode',
      text,
      scale: 3,
    });
    return `data:image/png;base64,${buffer.toString('base64')}`;
  }

  /**
   * Physical dimensions and layout knobs per label size. SMALL matches the
   * original 50x25mm garment-tag design exactly (no QR -- there isn't room
   * for one to stay scannable). MEDIUM and LARGE add a QR code, which is
   * generated from the same barcode value so it's a second, phone-scannable
   * copy of the same code rather than new information.
   */
  private readonly LABEL_SPECS: Record<
    LabelSize,
    {
      pageWidthMm: number;
      pageHeightMm: number;
      contentWidthMm: number;
      contentHeightMm: number;
      includeQr: boolean;
      layout: 'compact' | 'branded';
    }
  > = {
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

  private buildStickerBodyHtml(
    params: {
      storeName?: string;
      productName: string;
      variantTitle?: string;
      sku: string;
      price: number;
      barcode: string;
    },
    labelSize: LabelSize,
    barcodeDataUrl: string,
    qrDataUrl: string | null,
  ): string {
    const store = params.storeName || 'VASANTHI DESIGNERS';
    const variantStr = params.variantTitle ? ` | ${params.variantTitle}` : '';
    const spec = this.LABEL_SPECS[labelSize];
    // Truncated in JS rather than via CSS text-overflow: ellipsis -- headless
    // Chromium (used for the browser-print / iframe preview paths) has a
    // compositing bug where an overflow:hidden + ellipsis text node near a
    // border-radius element corrupts that text's rendering. Pre-truncating
    // the string sidesteps it entirely and is more portable besides.
    const maxTitleChars = spec.layout === 'branded' ? 34 : 22;
    const rawTitle = `${params.productName}${variantStr}`;
    const title =
      rawTitle.length > maxTitleChars
        ? `${rawTitle.slice(0, maxTitleChars - 1).trimEnd()}…`
        : rawTitle;

    if (spec.layout === 'branded') {
      // LARGE: branded header, SKU badge, barcode + QR side by side, price footer.
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

    // SMALL / MEDIUM: compact single-column layout (SMALL has no QR).
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

  private buildStickerCss(labelSize: LabelSize, forPreview: boolean): string {
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
    .brand-mark { font-size: 10px; color: #800020; line-height: 1; }
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

    // compact (SMALL / MEDIUM)
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

  async generateSingleStickerLabelHtml(
    params: {
      storeName?: string;
      productName: string;
      variantTitle?: string;
      sku: string;
      price: number;
      barcode: string;
    },
    labelSize: LabelSize = 'SMALL',
  ): Promise<string> {
    const spec = this.LABEL_SPECS[labelSize];
    const barcodeDataUrl = await this.generateBarcodeDataUrl(
      params.barcode,
      'code128',
      2,
      10,
    );
    const qrDataUrl = spec.includeQr
      ? await this.generateQrCodeDataUrl(params.barcode)
      : null;

    const bodyHtml = this.buildStickerBodyHtml(
      params,
      labelSize,
      barcodeDataUrl,
      qrDataUrl,
    );
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

  async generateBatchStickersHtml(
    dto: GenerateBatchStickersDto,
  ): Promise<string> {
    const labelSize: LabelSize = dto.labelSize || 'SMALL';
    const spec = this.LABEL_SPECS[labelSize];
    const singleLabelHtml = await this.generateSingleStickerLabelHtml(
      {
        storeName: dto.storeName,
        productName: dto.productName,
        variantTitle: dto.variantTitle,
        sku: dto.sku,
        price: dto.price,
        barcode: dto.barcode,
      },
      labelSize,
    );

    // Extract the sticker markup (inside <body>) to repeat it per copy.
    const match = singleLabelHtml.match(
      /<div class="sticker-page">([\s\S]*)<\/div>\s*<\/body>/,
    );
    const stickerInner = match ? match[1] : '';

    const stickerPages = Array.from({ length: dto.quantity })
      .map(
        () => `<div class="sticker-page">${stickerInner}</div>`,
      )
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
}
