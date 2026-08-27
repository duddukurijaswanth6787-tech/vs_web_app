import { PrismaService } from "../../database/prisma.service";
import { PreviewReceiptDto, GenerateBatchStickersDto } from './pos.types';
import { BarcodeService } from './barcode.service';
export declare class PrinterService {
    private readonly prisma;
    private readonly barcodeService;
    constructor(prisma: PrismaService, barcodeService: BarcodeService);
    private getStoreSettings;
    private numberToWords;
    private computeTotals;
    generateHtmlInvoiceReceipt(dto: PreviewReceiptDto): Promise<string>;
    buildEscPosInvoiceReceipt(dto: PreviewReceiptDto): Promise<Buffer>;
    buildTsplStickerLabel(dto: GenerateBatchStickersDto): string;
}
