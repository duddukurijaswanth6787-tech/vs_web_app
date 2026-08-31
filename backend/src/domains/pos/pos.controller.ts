import {
  Controller,
  Post,
  Get,
  Delete,
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
import {
  PermissionsGuard,
  Permissions,
} from '@domains/auth/guards/permissions.guard';
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
  CreatePosReturnDto,
  ClosePosShiftDto,
  PosCashMovementDto,
  DEFAULT_TERMINAL_ID,
} from './pos.types';
import type { Response } from 'express';

@ApiTags('POS (Point of Sale & Shopora)')
@Controller('pos')
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Post('scan')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('pos:view')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Scan Barcode or SKU for Instant Product Lookup' })
  @ApiResponse({ status: 200, type: BarcodeScanResultResponse })
  async scanBarcode(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ScanBarcodeDto,
  ): Promise<BarcodeScanResultResponse> {
    // scanBarcode() can return costPrice, which is margin data a cashier has
    // no reason to see. The parameter existed for that, but defaulted to true
    // and was never passed -- so it never actually withheld anything.
    const isOwnerOrManager = (user.roles || []).some((r) =>
      ['super_admin', 'admin'].includes(r),
    );
    return this.posService.scanBarcode(dto, isOwnerOrManager);
  }

  @Get('products/search')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('pos:view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search Sellable Products by Name or SKU' })
  @ApiResponse({ status: 200, type: [BarcodeScanResultResponse] })
  async searchProducts(
    @CurrentUser() user: JwtPayload,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
  ): Promise<BarcodeScanResultResponse[]> {
    // Same margin rule as the scan: only owners and managers see cost price.
    const isOwnerOrManager = (user.roles || []).some((r) =>
      ['super_admin', 'admin'].includes(r),
    );
    const parsedLimit = Number(limit);
    return this.posService.searchProducts(
      q || '',
      isOwnerOrManager,
      Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10,
    );
  }

  @Post('checkout-sessions')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('pos:view')
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

  @Get('checkout-sessions/held')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('pos:view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List Carts Parked at the Till' })
  async listHeldSessions(@Query('terminalId') terminalId?: string) {
    return this.posService.listHeldSessions(terminalId);
  }

  @Delete('checkout-sessions/:sessionId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('pos:view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Discard a Parked Cart' })
  async cancelHeldSession(@Param('sessionId') sessionId: string) {
    return this.posService.cancelHeldSession(sessionId);
  }

  @Post('checkout-sessions/adopt')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('pos:view')
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
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('pos:view')
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
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('pos:view')
  @ApiBearerAuth()
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
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('pos:view')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate N Copies of Barcode Sticker Labels (HTML & TSPL)',
  })
  async generateBatchStickers(@Body() dto: GenerateBatchStickersDto) {
    return this.posService.generateBatchStickers(dto);
  }

  @Post('printers/preview-receipt')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('pos:view')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Preview Invoice Thermal Receipt (HTML & ESC/POS Base64)',
  })
  async previewReceipt(@Body() dto: PreviewReceiptDto) {
    return this.posService.previewReceipt(dto);
  }

  @Get('customers/lookup')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('pos:view')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lookup Customer details & Order History by Phone Number',
  })
  async lookupCustomer(@Query('phone') phone: string) {
    return this.posService.lookupCustomer(phone || '');
  }

  @Get('returns/lookup')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('pos:view')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Look up an in-store sale and what is still returnable on it',
  })
  async lookupSaleForReturn(@Query('orderNumber') orderNumber: string) {
    return this.posService.lookupSaleForReturn(orderNumber || '');
  }

  @Post('returns')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('pos:view')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Take goods back at the counter: restock, refund, and record it',
  })
  async createReturn(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePosReturnDto,
  ) {
    return this.posService.createReturn(user.sub, dto);
  }

  @Post('shifts/open')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('pos:view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Open a new till/shift with a starting cash float' })
  async openShift(
    @CurrentUser() user: JwtPayload,
    @Body() dto: OpenPosShiftDto,
  ) {
    return this.posService.openShift(user.sub, dto);
  }

  @Get('shifts/current')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('pos:view')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the current logged-in cashier's open shift" })
  async getCurrentShift(
    @CurrentUser() user: JwtPayload,
    @Query('terminalId') terminalId?: string,
  ) {
    return this.posService.getCurrentShift(user.sub, terminalId);
  }

  @Post('shifts/:id/close')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('pos:view')
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
  @ApiOperation({
    summary:
      'List shifts (till reconciliation history) -- Till & Shift Dashboard access, gated by the pos:view permission',
  })
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

  @Post('shifts/cash-movements')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('pos:view')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record Cash Paid Into or Out of the Drawer (Petty Cash)',
  })
  async recordCashMovement(
    @CurrentUser() user: JwtPayload,
    @Body() dto: PosCashMovementDto,
    @Query('terminalId') terminalId?: string,
  ) {
    return this.posService.recordCashMovement(
      user.sub,
      terminalId || DEFAULT_TERMINAL_ID,
      dto,
    );
  }

  @Get('shifts/:id/cash-movements')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('pos:view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List Drawer Cash Movements for a Shift' })
  async listCashMovements(@Param('id') id: string) {
    return this.posService.listCashMovements(id);
  }

  @Get('shifts/:id/report')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('pos:view')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Get the X-Report (open shift) or Z-Report (closed shift) for a shift -- Till & Shift Dashboard access, gated by the pos:view permission',
  })
  async getShiftReport(@Param('id') id: string) {
    return this.posService.getShiftReport(id);
  }

  @Get('analytics/summary')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('pos:view')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Day-level POS summary: payment split, terminal & cashier performance, returns -- Till & Shift Dashboard access, gated by the pos:view permission',
  })
  async getPosAnalyticsSummary(@Query('date') date?: string) {
    return this.posService.getPosDaySummary(date);
  }
}
