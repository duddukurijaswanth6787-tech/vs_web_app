import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bwipjs from 'bwip-js';
import { GenerateBatchStickersDto } from './pos.types';

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

  async generateSingleStickerLabelHtml(params: {
    storeName?: string;
    productName: string;
    variantTitle?: string;
    sku: string;
    price: number;
    barcode: string;
  }): Promise<string> {
    const barcodeDataUrl = await this.generateBarcodeDataUrl(
      params.barcode,
      'code128',
      2,
      10,
    );
    const store = params.storeName || 'VASANTHI DESIGNERS';
    const variantStr = params.variantTitle ? ` | ${params.variantTitle}` : '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page {
      size: 50mm 25mm;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 2mm 3mm;
      width: 44mm;
      height: 21mm;
      font-family: 'Helvetica Neue', Arial, sans-serif;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      text-align: center;
      background: #ffffff;
      color: #000000;
    }
    .store-name {
      font-size: 7px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      line-height: 1;
    }
    .product-title {
      font-size: 8px;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
      line-height: 1.1;
      margin-top: 1px;
    }
    .barcode-img {
      max-width: 100%;
      height: 10mm;
      object-fit: contain;
    }
    .footer-row {
      display: flex;
      justify-content: space-between;
      width: 100%;
      font-size: 8px;
      font-weight: 800;
      line-height: 1;
    }
    .sku {
      font-family: monospace;
      font-size: 7px;
    }
    .price {
      font-size: 9px;
      font-weight: 900;
    }
  </style>
</head>
<body>
  <div class="store-name">${store}</div>
  <div class="product-title">${params.productName}${variantStr}</div>
  <img src="${barcodeDataUrl}" class="barcode-img" alt="${params.barcode}" />
  <div class="footer-row">
    <span class="sku">${params.sku}</span>
    <span class="price">₹${params.price}</span>
  </div>
</body>
</html>
    `.trim();
  }

  async generateBatchStickersHtml(
    dto: GenerateBatchStickersDto,
  ): Promise<string> {
    const singleLabelHtml = await this.generateSingleStickerLabelHtml({
      storeName: dto.storeName,
      productName: dto.productName,
      variantTitle: dto.variantTitle,
      sku: dto.sku,
      price: dto.price,
      barcode: dto.barcode,
    });

    // Extract the body content
    const match = singleLabelHtml.match(/<body>([\s\S]*)<\/body>/);
    const bodyContent = match ? match[1] : '';

    const stickerPages = Array.from({ length: dto.quantity })
      .map(() => `<div class="sticker-page">${bodyContent}</div>`)
      .join('\n');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Batch Label Stickers (${dto.quantity} copies)</title>
  <style>
    @media print {
      @page {
        size: 50mm 25mm;
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
    .sticker-page {
      margin: 0 auto 10px auto;
      padding: 2mm 3mm;
      width: 44mm;
      height: 21mm;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      text-align: center;
      background: #ffffff;
      color: #000000;
      border: 1px dashed #ccc;
    }
    .store-name {
      font-size: 7px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      line-height: 1;
    }
    .product-title {
      font-size: 8px;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
      line-height: 1.1;
      margin-top: 1px;
    }
    .barcode-img {
      max-width: 100%;
      height: 10mm;
      object-fit: contain;
    }
    .footer-row {
      display: flex;
      justify-content: space-between;
      width: 100%;
      font-size: 8px;
      font-weight: 800;
      line-height: 1;
    }
    .sku {
      font-family: monospace;
      font-size: 7px;
    }
    .price {
      font-size: 9px;
      font-weight: 900;
    }
  </style>
</head>
<body>
  ${stickerPages}
</body>
</html>
    `.trim();
  }
}
