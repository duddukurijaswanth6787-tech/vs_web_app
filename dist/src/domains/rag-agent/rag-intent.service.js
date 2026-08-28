"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RagIntentService = void 0;
const common_1 = require("@nestjs/common");
let RagIntentService = class RagIntentService {
    routeIntent(message) {
        const text = message.toLowerCase().trim();
        if ((text.includes('order') ||
            text.includes('track') ||
            text.includes('where is')) &&
            (/ord-\d+/i.test(text) ||
                text.includes('status') ||
                text.includes('timeline'))) {
            return 'ORDER_TRACKING';
        }
        if (text.includes('refund') ||
            text.includes('money back') ||
            text.includes('reimburse')) {
            if (text.includes('status') ||
                text.includes('when') ||
                text.includes('receive')) {
                return 'REFUND_STATUS';
            }
            return 'REFUND_POLICY';
        }
        if (text.includes('return') ||
            text.includes('exchange') ||
            text.includes('replace')) {
            if (text.includes('status') ||
                text.includes('where is') ||
                text.includes('approved')) {
                return 'RETURN_STATUS';
            }
            return 'RETURN_POLICY';
        }
        if (text.includes('buy') ||
            text.includes('find') ||
            text.includes('dress') ||
            text.includes('kurti') ||
            text.includes('saree') ||
            text.includes('stock') ||
            text.includes('available') ||
            text.includes('size') ||
            text.includes('color')) {
            if (text.includes('stock') ||
                text.includes('available') ||
                text.includes('left')) {
                return 'PRODUCT_AVAILABILITY';
            }
            return 'PRODUCT_SEARCH';
        }
        if (text.includes('wear') ||
            text.includes('styling') ||
            text.includes('trends') ||
            text.includes('wedding') ||
            text.includes('occasion') ||
            text.includes('match')) {
            return 'FASHION_ADVICE';
        }
        if (text.includes('ship') ||
            text.includes('delivery time') ||
            text.includes('courier')) {
            return 'SHIPPING_POLICY';
        }
        if (text.includes('pay') ||
            text.includes('razorpay') ||
            text.includes('card') ||
            text.includes('upi') ||
            text.includes('wallet')) {
            return 'PAYMENT_HELP';
        }
        if (text.includes('faq') ||
            text.includes('question') ||
            text.includes('how do i') ||
            text.includes('policy')) {
            return 'FAQ';
        }
        return 'UNKNOWN';
    }
};
exports.RagIntentService = RagIntentService;
exports.RagIntentService = RagIntentService = __decorate([
    (0, common_1.Injectable)()
], RagIntentService);
//# sourceMappingURL=rag-intent.service.js.map