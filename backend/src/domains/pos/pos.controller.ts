import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { PermissionsGuard, Permissions } from '@domains/auth/guards/permissions.guard';
import type { JwtPayload } from '@domains/auth/services/jwt.service';
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
  OpenPosShiftDto,
  ClosePosShiftDto,
} from './pos.types';
import type { Response } from 'express';

@ApiTags('POS (Point of Sale & Shopora)')
@Controller('pos')
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Post('scan')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCheckoutSessionDto,
  ): Promise<CheckoutSessionResponse> {
    return this.posService.createCheckoutSession(user.sub, dto);
  }

  @Post('checkout-sessions/adopt')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
    @CurrentUser() user: JwtPayload,
    @Body() dto: CompletePosSaleDto,
  ) {
    return this.posService.completeSale(user.sub, dto);
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lookup Customer details & Order History by Phone Number',
  })
  async lookupCustomer(@Query('phone') phone: string) {
    return this.posService.lookupCustomer(phone || '');
  }

  @Post('shifts/open')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Open a new till/shift with a starting cash float' })
  async openShift(
    @CurrentUser() user: JwtPayload,
    @Body() dto: OpenPosShiftDto,
  ) {
    return this.posService.openShift(user.sub, dto);
  }

  @Get('shifts/current')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current logged-in cashier\'s open shift' })
  async getCurrentShift(
    @CurrentUser() user: JwtPayload,
    @Query('terminalId') terminalId?: string,
  ) {
    return this.posService.getCurrentShift(user.sub, terminalId);
  }

  @Post('shifts/:id/close')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Close a shift: count cash, compute variance' })
  async closeShift(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ClosePosShiftDto,
  ) {
    return this.posService.closeShift(id, user.sub, dto);
  }

  @Get('shifts')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('pos:view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List shifts (till reconciliation history) -- Till & Shift Dashboard access, gated by the pos:view permission' })
  async listShifts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('terminalId') terminalId?: string,
    @Query('cashierId') cashierId?: string,
  ) {
    return this.posService.listShifts({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      status,
      terminalId,
      cashierId,
    });
  }

  @Get('shifts/:id/report')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('pos:view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the X-Report (open shift) or Z-Report (closed shift) for a shift -- Till & Shift Dashboard access, gated by the pos:view permission' })
  async getShiftReport(@Param('id') id: string) {
    return this.posService.getShiftReport(id);
  }

  @Get('analytics/summary')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('pos:view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Day-level POS summary: payment split, terminal & cashier performance, returns -- Till & Shift Dashboard access, gated by the pos:view permission' })
  async getPosAnalyticsSummary(@Query('date') date?: string) {
    return this.posService.getPosDaySummary(date);
  }
}
