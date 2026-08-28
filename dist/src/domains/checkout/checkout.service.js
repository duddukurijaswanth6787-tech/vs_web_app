"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
const cart_service_1 = require("../cart/cart.service");
const coupon_service_1 = require("../coupon/coupon.service");
const offer_service_1 = require("../offer/offer.service");
const order_workflow_service_1 = require("../order/order-workflow.service");
const payment_service_1 = require("../payment/payment.service");
const prisma_service_1 = require("../../database/prisma.service");
const SHIPPING_RATES = {
    STANDARD: 50,
    EXPRESS: 100,
    SAME_DAY: 200,
};
const SHIPPING_ESTIMATES = {
    STANDARD: '5-7 business days',
    EXPRESS: '2-3 business days',
    SAME_DAY: 'Same day delivery',
};
let CheckoutService = class CheckoutService {
    prisma;
    auditService;
    cartService;
    couponService;
    offerService;
    workflow;
    paymentService;
    configService;
    constructor(prisma, auditService, cartService, couponService, offerService, workflow, paymentService, configService) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.cartService = cartService;
        this.couponService = couponService;
        this.offerService = offerService;
        this.workflow = workflow;
        this.paymentService = paymentService;
        this.configService = configService;
    }
    async resolveDiscount(userId, couponCode, subtotal, items) {
        let couponDiscount = 0;
        let freeShipping = false;
        if (couponCode) {
            const result = await this.couponService.checkCoupon(userId, couponCode, subtotal, items);
            couponDiscount = Math.min(result.discountAmount, subtotal);
            freeShipping = result.freeShipping;
        }
        let offerDiscount = 0;
        try {
            const activeOffers = await this.offerService.getActiveOffers();
            const best = this.offerService.calculateDiscount(items, activeOffers);
            if (best)
                offerDiscount = Math.min(best.discount, subtotal);
        }
        catch {
            offerDiscount = 0;
        }
        return {
            discountTotal: Math.max(couponDiscount, offerDiscount),
            couponDiscount,
            freeShipping,
        };
    }
    async validateAddress(addressId, userId) {
        const profile = await this.prisma.customerProfile.findUnique({
            where: { userId },
        });
        if (!profile)
            throw new exceptions_1.BusinessException('Customer profile not found', 'CHECKOUT_001');
        const address = await this.prisma.customerAddress.findUnique({
            where: { id: addressId },
        });
        if (!address || address.customerId !== profile.id)
            throw new exceptions_1.BusinessException('Address not found', 'CHECKOUT_002');
        return { profile, address };
    }
    calculateShipping(method, subtotal, freeShipping = false) {
        if (freeShipping)
            return 0;
        if (method === 'STANDARD' && subtotal >= 500)
            return 0;
        return SHIPPING_RATES[method] ?? SHIPPING_RATES.STANDARD;
    }
    async buildItems(cartItems) {
        const productIds = cartItems.map((i) => i.productId);
        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds }, deletedAt: null },
            select: { id: true, name: true, status: true, taxPercentage: true, brandId: true },
        });
        const productMap = new Map(products.map((p) => [p.id, p]));
        const brandByProduct = new Map(products.map((p) => [p.id, p.brandId ?? undefined]));
        const items = [];
        for (const item of cartItems) {
            const product = productMap.get(item.productId);
            if (!product)
                throw new exceptions_1.BusinessException('Product not found', 'CHECKOUT_003');
            if (product.status !== 'ACTIVE')
                throw new exceptions_1.BusinessException('Product is not available', 'CHECKOUT_004');
            if (item.variantId) {
                const inventory = await this.prisma.inventory.findUnique({
                    where: { variantId: item.variantId },
                });
                if (inventory) {
                    const available = inventory.availableQuantity - inventory.reservedQuantity;
                    if (available < item.quantity && !inventory.allowBackorder)
                        throw new exceptions_1.BusinessException('Insufficient stock', 'CHECKOUT_005');
                }
            }
            const unitPrice = Number(item.unitPrice);
            const totalPrice = unitPrice * item.quantity;
            const taxAmount = totalPrice * (Number(product.taxPercentage ?? 0) / 100);
            items.push({
                productId: item.productId,
                productName: product.name,
                variantId: item.variantId ?? undefined,
                quantity: item.quantity,
                unitPrice,
                totalPrice,
                taxAmount: Math.round(taxAmount * 100) / 100,
            });
        }
        return { items, brandByProduct };
    }
    async preview(userId, dto) {
        await this.validateAddress(dto.addressId, userId);
        const cart = await this.cartService.getCartByUser(userId);
        if (!cart.items || cart.items.length === 0)
            throw new exceptions_1.BusinessException('Cart is empty', 'CHECKOUT_006');
        const activeItems = cart.items.filter((i) => !i.savedForLater);
        const { items, brandByProduct } = await this.buildItems(activeItems);
        const method = dto.shippingMethod ?? 'STANDARD';
        const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
        const discountItems = items.map((i) => ({
            productId: i.productId,
            brandId: brandByProduct.get(i.productId),
            price: i.unitPrice,
            quantity: i.quantity,
        }));
        const { discountTotal, freeShipping } = await this.resolveDiscount(userId, dto.couponCode, subtotal, discountItems);
        const taxTotal = items.reduce((sum, i) => sum + i.taxAmount, 0);
        const shippingCharge = this.calculateShipping(method, subtotal, freeShipping);
        const grandTotal = subtotal - discountTotal + taxTotal + shippingCharge;
        return {
            items,
            itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
            subtotal: Math.round(subtotal * 100) / 100,
            discountTotal,
            taxTotal: Math.round(taxTotal * 100) / 100,
            shippingCharge,
            grandTotal: Math.round(grandTotal * 100) / 100,
            estimatedDelivery: SHIPPING_ESTIMATES[method] ?? SHIPPING_ESTIMATES.STANDARD,
        };
    }
    async placeOrder(userId, dto) {
        const { profile, address } = await this.validateAddress(dto.addressId, userId);
        const cart = await this.cartService.getCartByUser(userId);
        if (!cart.items || cart.items.length === 0)
            throw new exceptions_1.BusinessException('Cart is empty', 'CHECKOUT_006');
        const activeItems = cart.items.filter((i) => !i.savedForLater);
        const { items, brandByProduct } = await this.buildItems(activeItems);
        const method = dto.shippingMethod ?? 'STANDARD';
        const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
        const discountItems = items.map((i) => ({
            productId: i.productId,
            brandId: brandByProduct.get(i.productId),
            price: i.unitPrice,
            quantity: i.quantity,
        }));
        const { discountTotal, couponDiscount, freeShipping } = await this.resolveDiscount(userId, dto.couponCode, subtotal, discountItems);
        const taxTotal = items.reduce((sum, i) => sum + i.taxAmount, 0);
        const shippingCharge = this.calculateShipping(method, subtotal, freeShipping);
        const grandTotal = subtotal - discountTotal + taxTotal + shippingCharge;
        const orderNumber = await this.workflow.generateOrderNumber();
        const order = await this.prisma.$transaction(async (tx) => {
            const createdOrder = await tx.order.create({
                data: {
                    orderNumber,
                    customerId: profile.id,
                    status: 'PENDING',
                    subtotal,
                    discountTotal,
                    taxTotal,
                    shippingCharge,
                    grandTotal: Math.round(grandTotal * 100) / 100,
                    notes: dto.notes,
                    deliveryInstructions: dto.deliveryInstructions,
                    preferredDeliverySlot: dto.preferredDeliverySlot,
                    isGift: Boolean(dto.isGift),
                    giftWrapMessage: dto.giftWrapMessage,
                    terminalId: dto.terminalId,
                    addresses: {
                        create: [
                            {
                                addressType: 'SHIPPING',
                                fullName: address.fullName,
                                phone: address.phone,
                                addressLine1: address.addressLine1,
                                addressLine2: address.addressLine2,
                                city: address.city,
                                state: address.state,
                                country: address.country,
                                postalCode: address.postalCode,
                            },
                        ],
                    },
                    items: {
                        create: items.map((i) => ({
                            product: { connect: { id: i.productId } },
                            ...(i.variantId
                                ? { variant: { connect: { id: i.variantId } } }
                                : {}),
                            productName: i.productName,
                            sku: 'SKU',
                            quantity: i.quantity,
                            unitPrice: i.unitPrice,
                            totalPrice: i.totalPrice,
                            taxAmount: i.taxAmount,
                        })),
                    },
                },
                include: { items: true },
            });
            await tx.orderTimeline.create({
                data: {
                    orderId: createdOrder.id,
                    status: 'PENDING',
                    message: 'Order placed',
                    createdBy: userId,
                },
            });
            return createdOrder;
        });
        try {
            await this.workflow.reserveInventory(order.id, userId);
        }
        catch (err) {
            await this.workflow.transition(order.id, 'CANCELLED', userId, 'Auto-cancelled: insufficient stock at checkout');
            throw err;
        }
        await this.cartService.clearCart(userId, undefined);
        if (dto.couponCode && (couponDiscount > 0 || freeShipping)) {
            await this.couponService.applyCoupon(userId, {
                code: dto.couponCode,
                orderId: order.id,
                orderAmount: subtotal,
                items: discountItems,
            });
        }
        await this.auditService.log({
            action: 'ORDER_CREATED',
            module: 'checkout',
            resource: 'order',
            resourceId: order.id,
            userId,
            newValue: { orderNumber, grandTotal: order.grandTotal },
        });
        const paymentMethod = dto.paymentMethod ?? 'COD';
        if (paymentMethod === 'RAZORPAY') {
            const payment = await this.paymentService.create(userId, {
                orderId: order.id,
                method: 'RAZORPAY',
                provider: 'razorpay',
                amount: Number(order.grandTotal),
                currency: order.currency,
            });
            const paymentInfo = {
                paymentId: payment.id,
                providerOrderId: payment.providerOrderId ?? '',
                amount: payment.amount,
                currency: payment.currency,
                razorpayKeyId: this.configService.get('app.razorpay.keyId') || '',
            };
            return { ...order, payment: paymentInfo };
        }
        await this.workflow.notifyOrderConfirmed(order.id);
        return order;
    }
};
exports.CheckoutService = CheckoutService;
exports.CheckoutService = CheckoutService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        cart_service_1.CartService,
        coupon_service_1.CouponService,
        offer_service_1.OfferService,
        order_workflow_service_1.OrderWorkflowService,
        payment_service_1.PaymentService,
        config_1.ConfigService])
], CheckoutService);
//# sourceMappingURL=checkout.service.js.map