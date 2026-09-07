import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto, InvoiceQueryDto } from './invoice.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import { PrismaService } from '@database/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Invoices')
@Controller('invoices')
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly prisma: PrismaService,
  ) {}

  private async isAdmin(userId: string): Promise<boolean> {
    const row = await this.prisma.userRole.findFirst({
      where: { userId, role: { name: { in: ['super_admin', 'admin'] } } },
      select: { userId: true },
    });
    return row !== null;
  }

  private async resolveCustomerId(userId: string): Promise<string | null> {
    const p = await this.prisma.customerProfile.findUnique({ where: { userId } });
    return p?.id ?? null;
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List invoices' })
  async findAll(@Query() query: InvoiceQueryDto) {
    return ResponseBuilder.success(await this.invoiceService.findAll(query));
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get invoices by order ID' })
  async findByOrderId(
    @Param('orderId') orderId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!await this.isAdmin(user.sub)) {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { customerId: true },
      });
      const customerId = await this.resolveCustomerId(user.sub);
      if (!order || order.customerId !== customerId)
        throw new ForbiddenException('Invoice not found');
    }
    return ResponseBuilder.success(
      await this.invoiceService.findByOrderId(orderId),
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get invoice by ID' })
  async findById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const invoice = await this.invoiceService.findById(id);
    if (!await this.isAdmin(user.sub)) {
      const order = await this.prisma.order.findUnique({
        where: { id: (invoice as any).orderId },
        select: { customerId: true },
      });
      const customerId = await this.resolveCustomerId(user.sub);
      if (!order || order.customerId !== customerId)
        throw new ForbiddenException('Invoice not found');
    }
    return ResponseBuilder.success(invoice);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create invoice' })
  async create(@Body() dto: CreateInvoiceDto, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.invoiceService.create(user.sub, dto),
      'Invoice created',
    );
  }
}
