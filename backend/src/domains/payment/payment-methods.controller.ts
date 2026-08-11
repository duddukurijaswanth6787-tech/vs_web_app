import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '@database/prisma.service';
import { ResponseBuilder } from '@common/responses/response.builder';

@ApiTags('Payment Methods')
@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Get available payment methods (public)' })
  async getMethods() {
    const settings = await this.prisma.appSetting.findMany({
      where: { group: 'payment' },
    });
    const map = new Map(settings.map((s) => [s.key, s.value]));

    const getBool = (key: string, def: boolean) => {
      const v = map.get(key);
      return v !== undefined ? v === 'true' : def;
    };
    const getNum = (key: string, def: number) => {
      const v = map.get(key);
      return v !== undefined ? Number(v) || def : def;
    };
    const getStr = (key: string, def: string) => map.get(key) || def;

    const methods = [
      {
        code: 'razorpay',
        title: getStr('payment_razorpay_title', 'Online Payment'),
        description: getStr(
          'payment_razorpay_description',
          'Pay securely using UPI, Cards, Net Banking',
        ),
        enabled: getBool('payment_razorpay_enabled', true),
        displayOrder: getNum('payment_razorpay_display_order', 1),
        icon: getStr('payment_razorpay_icon', ''),
        minAmount: getNum('payment_razorpay_min_amount', 0),
        maxAmount: getNum('payment_razorpay_max_amount', 999999),
      },
      {
        code: 'cod',
        title: getStr('payment_cod_title', 'Cash On Delivery'),
        description: getStr(
          'payment_cod_description',
          'Pay when the order is delivered',
        ),
        enabled: getBool('payment_cod_enabled', true),
        displayOrder: getNum('payment_cod_display_order', 2),
        icon: getStr('payment_cod_icon', ''),
        minAmount: getNum('payment_cod_min_amount', 0),
        maxAmount: getNum('payment_cod_max_amount', 5000),
      },
    ];

    return ResponseBuilder.success(
      methods
        .filter((m) => m.enabled)
        .sort((a, b) => a.displayOrder - b.displayOrder),
    );
  }
}
