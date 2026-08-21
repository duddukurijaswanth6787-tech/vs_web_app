import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Headers,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import {
  CreatePaymentDto,
  PaymentQueryDto,
  VerifyPaymentDto,
  UpdateRazorpayConfigDto,
} from './payment.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { PermissionsGuard, Permissions } from '@domains/auth/guards/permissions.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('payments:view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List payments' })
  async findAll(@Query() query: PaymentQueryDto) {
    return ResponseBuilder.success(await this.paymentService.findAll(query));
  }

  @Get('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Razorpay gateway config (Super Admin)' })
  async getConfig() {
    return ResponseBuilder.success(await this.paymentService.getConfig());
  }

  @Patch('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update Razorpay gateway config (Super Admin)' })
  async updateConfig(
    @Body() dto: UpdateRazorpayConfigDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.paymentService.updateConfig(dto, user.sub),
      'Razorpay credentials updated',
    );
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payments by order ID' })
  async findByOrderId(@Param('orderId') orderId: string) {
    return ResponseBuilder.success(
      await this.paymentService.findByOrderId(orderId),
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment by ID' })
  async findById(@Param('id') id: string) {
    return ResponseBuilder.success(await this.paymentService.findById(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment' })
  async create(@Body() dto: CreatePaymentDto, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.paymentService.create(user.sub, dto),
      'Payment created',
    );
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('payments:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update payment status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.paymentService.updateStatus(id, body.status, user.sub),
      'Payment status updated',
    );
  }

  @Post(':id/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify payment signature' })
  async verifyPayment(
    @Param('id') id: string,
    @Body() dto: VerifyPaymentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.paymentService.verifyPayment(
        id,
        dto.razorpayPaymentId,
        dto.razorpaySignature,
        user.sub,
      ),
      'Payment verified successfully',
    );
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Razorpay webhook callback handler' })
  async handleWebhook(
    @Body() body: any,
    @Headers('x-razorpay-signature') signature: string,
    @Req() req: any,
  ) {
    const rawBody = req.rawBody
      ? req.rawBody.toString('utf8')
      : JSON.stringify(body);
    const result = await this.paymentService.handleWebhook(
      rawBody,
      signature || '',
    );
    return ResponseBuilder.success(result);
  }
}
