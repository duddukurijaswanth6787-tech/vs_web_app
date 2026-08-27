import { GenerateBatchStickersDto, LabelSize } from './pos.types';
export declare class BarcodeService {
    private readonly logger;
    generateBarcodeBuffer(text: string, bcid?: string, scale?: number, height?: number): Promise<Buffer>;
    generateBarcodeDataUrl(text: string, bcid?: string, scale?: number, height?: number): Promise<string>;
    generateQrCodeDataUrl(text: string): Promise<string>;
    private readonly LABEL_SPECS;
    private buildStickerBodyHtml;
    private buildStickerCss;
    generateSingleStickerLabelHtml(params: {
        storeName?: string;
        productName: string;
        variantTitle?: string;
        sku: string;
        price: number;
        barcode: string;
    }, labelSize?: LabelSize): Promise<string>;
    generateBatchStickersHtml(dto: GenerateBatchStickersDto): Promise<string>;
}
