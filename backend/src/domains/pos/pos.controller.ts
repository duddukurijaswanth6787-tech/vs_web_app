import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Res,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@domains/auth/guards/jwt-auth.guard';
import { PosService } from './pos.service';
import {
  ScanBarcodeDto,
  CreateCheckoutSessionDto,
  AdoptHandoffTokenDto,
  CompletePosSaleDto,
  BarcodeScanResultResponse,
  CheckoutSessionResponse,
  GenerateBarcodeImageDto,
  GenerateBatchStickersDto,
  PreviewReceiptDto,
} from './pos.types';
import type { Response } from 'express';

@ApiTags('POS (Point of Sale & Shopora)')
@Controller('pos')
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Post('scan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Scan Barcode or SKU for Instant Product Lookup' })
  @ApiResponse({ status: 200, type: BarcodeScanResultResponse })
  async scanBarcode(
    @Body() dto: ScanBarcodeDto,
  ): Promise<BarcodeScanResultResponse> {
    return this.posService.scanBarcode(dto);
  }

  @Post('checkout-sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create Mobile-to-Desktop Checkout Handoff Session',
  })
  @ApiResponse({ status: 201, type: CheckoutSessionResponse })
  async createCheckoutSession(
    @Req() req: { user: { id: string } },
    @Body() dto: CreateCheckoutSessionDto,
  ): Promise<CheckoutSessionResponse> {
    return this.posService.createCheckoutSession(req.user.id, dto);
  }

  @Post('checkout-sessions/adopt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Adopt Handoff Token on Desktop Web POS' })
  @ApiResponse({ status: 200, type: CheckoutSessionResponse })
  async adoptHandoffSession(
    @Body() dto: AdoptHandoffTokenDto,
  ): Promise<CheckoutSessionResponse> {
    return this.posService.adoptHandoffSession(dto);
  }

  @Post('sales/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete POS Sale & Trigger Invoice Printing' })
  async completeSale(
    @Req() req: { user: { id: string } },
    @Body() dto: CompletePosSaleDto,
  ) {
    return this.posService.completeSale(req.user.id, dto);
  }

  @Get('barcodes/generate')
  @ApiOperation({
    summary: 'Generate Code128 / EAN / QR Barcode PNG Image Stream',
  })
  async generateBarcodeImage(
    @Query() query: GenerateBarcodeImageDto,
    @Res() res: Response,
  ) {
    const buffer = await this.posService.generateBarcodeImage(query);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  }

  @Post('barcodes/batch-stickers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate N Copies of Barcode Sticker Labels (HTML & TSPL)',
  })
  async generateBatchStickers(@Body() dto: GenerateBatchStickersDto) {
    return this.posService.generateBatchStickers(dto);
  }

  @Post('printers/preview-receipt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Preview Invoice Thermal Receipt (HTML & ESC/POS Base64)',
  })
  async previewReceipt(@Body() dto: PreviewReceiptDto) {
    return this.posService.previewReceipt(dto);
  }

  @Get('customers/lookup')
  @ApiOperation({
    summary: 'Lookup Customer details & Order History by Phone Number',
  })
  async lookupCustomer(@Query('phone') phone: string) {
    return this.posService.lookupCustomer(phone || '');
  }
}
