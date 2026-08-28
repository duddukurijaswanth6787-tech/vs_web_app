"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const config_module_1 = require("../config/config.module");
const database_module_1 = require("../database/database.module");
const logger_module_1 = require("../common/logger/logger.module");
const redis_module_1 = require("../infrastructure/redis/redis.module");
const queues_module_1 = require("../infrastructure/queues/queues.module");
const storage_module_1 = require("../infrastructure/storage/storage.module");
const correlation_id_middleware_1 = require("../common/middleware/correlation-id.middleware");
const security_module_1 = require("../common/security/security.module");
const ai_prompt_module_1 = require("../modules/ai-prompts/ai-prompt.module");
const http_logging_interceptor_1 = require("../common/interceptors/http-logging.interceptor");
const global_response_interceptor_1 = require("../common/interceptors/global-response.interceptor");
const startup_module_1 = require("../common/startup/startup.module");
const global_exception_filter_1 = require("../common/filters/global-exception.filter");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const health_module_1 = require("./health/health.module");
const monitoring_module_1 = require("./monitoring/monitoring.module");
const identity_module_1 = require("../shared/identity/identity.module");
const auth_module_1 = require("../domains/auth/auth.module");
const users_module_1 = require("../domains/users/users.module");
const roles_module_1 = require("../domains/roles/roles.module");
const permissions_module_1 = require("../domains/permissions/permissions.module");
const staff_module_1 = require("../domains/staff/staff.module");
const audit_module_1 = require("../domains/audit/audit.module");
const session_module_1 = require("../domains/session/session.module");
const password_reset_module_1 = require("../domains/password-reset/password-reset.module");
const email_verification_module_1 = require("../domains/email-verification/email-verification.module");
const commerce_module_1 = require("../shared/commerce/commerce.module");
const categories_module_1 = require("../domains/categories/categories.module");
const brands_module_1 = require("../domains/brands/brands.module");
const attributes_module_1 = require("../domains/attributes/attributes.module");
const products_module_1 = require("../domains/products/products.module");
const product_variants_module_1 = require("../domains/product-variants/product-variants.module");
const inventory_module_1 = require("../domains/inventory/inventory.module");
const warehouse_module_1 = require("../domains/warehouse/warehouse.module");
const media_module_1 = require("../domains/media/media.module");
const library_module_1 = require("../domains/library/library.module");
const search_module_1 = require("../domains/search/search.module");
const me_module_1 = require("../domains/me/me.module");
const order_module_1 = require("../domains/order/order.module");
const checkout_module_1 = require("../domains/checkout/checkout.module");
const return_request_module_1 = require("../domains/return-request/return-request.module");
const cancellation_module_1 = require("../domains/cancellation/cancellation.module");
const payment_module_1 = require("../domains/payment/payment.module");
const coupon_module_1 = require("../domains/coupon/coupon.module");
const offer_module_1 = require("../domains/offer/offer.module");
const shipping_module_1 = require("../domains/shipping/shipping.module");
const tax_module_1 = require("../domains/tax/tax.module");
const invoice_module_1 = require("../domains/invoice/invoice.module");
const refund_module_1 = require("../domains/refund/refund.module");
const wallet_module_1 = require("../domains/wallet/wallet.module");
const notification_module_1 = require("../domains/notification/notification.module");
const review_module_1 = require("../domains/review/review.module");
const cms_module_1 = require("../domains/cms/cms.module");
const testimonials_module_1 = require("../domains/testimonials/testimonials.module");
const dashboard_module_1 = require("../domains/dashboard/dashboard.module");
const report_module_1 = require("../domains/report/report.module");
const app_setting_module_1 = require("../domains/app-setting/app-setting.module");
const support_module_1 = require("../domains/support/support.module");
const faq_module_1 = require("../domains/faq/faq.module");
const campaign_module_1 = require("../domains/campaign/campaign.module");
const ai_chat_module_1 = require("../domains/ai-chat/ai-chat.module");
const size_chart_module_1 = require("../domains/size-chart/size-chart.module");
const ai_search_module_1 = require("../domains/ai-search/ai-search.module");
const ai_recommendation_module_1 = require("../domains/ai-recommendation/ai-recommendation.module");
const ai_analytics_module_1 = require("../domains/ai-analytics/ai-analytics.module");
const ai_admin_module_1 = require("../domains/ai-admin/ai-admin.module");
const social_module_1 = require("../domains/social/social.module");
const rag_agent_module_1 = require("../domains/rag-agent/rag-agent.module");
const rag_knowledge_module_1 = require("../domains/rag-knowledge/rag-knowledge.module");
const storefront_module_1 = require("../modules/storefront/storefront.module");
const feature_gate_module_1 = require("../common/feature-gate/feature-gate.module");
const otp_module_1 = require("../domains/otp/otp.module");
const otp_gateway_module_1 = require("../domains/otp-gateway/otp-gateway.module");
const loyalty_module_1 = require("../domains/loyalty/loyalty.module");
const gift_card_module_1 = require("../domains/gift-card/gift-card.module");
const referral_module_1 = require("../domains/referral/referral.module");
const recently_viewed_module_1 = require("../domains/recently-viewed/recently-viewed.module");
const packing_module_1 = require("../domains/packing/packing.module");
const sms_module_1 = require("../domains/sms/sms.module");
const email_module_1 = require("../domains/email/email.module");
const push_notification_module_1 = require("../domains/push-notification/push-notification.module");
const dtdc_module_1 = require("../domains/dtdc/dtdc.module");
const pos_module_1 = require("../domains/pos/pos.module");
const quotation_module_1 = require("../domains/quotation/quotation.module");
const analytics_module_1 = require("../domains/analytics/analytics.module");
const aws_billing_module_1 = require("../domains/aws-billing/aws-billing.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(correlation_id_middleware_1.CorrelationIdMiddleware).forRoutes('*path');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_module_1.ConfigModule,
            logger_module_1.LoggerModule,
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => [
                    {
                        ttl: configService.get('app.throttle.ttl', 60) * 1000,
                        limit: configService.get('app.throttle.limit', 100),
                    },
                ],
            }),
            security_module_1.SecurityModule,
            ai_prompt_module_1.AiPromptModule,
            startup_module_1.StartupModule,
            database_module_1.DatabaseModule,
            redis_module_1.RedisModule,
            queues_module_1.QueuesModule,
            storage_module_1.StorageModule,
            health_module_1.HealthModule,
            monitoring_module_1.MonitoringModule,
            identity_module_1.IdentityModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            roles_module_1.RolesModule,
            permissions_module_1.PermissionsModule,
            staff_module_1.StaffModule,
            audit_module_1.AuditModule,
            session_module_1.SessionModule,
            password_reset_module_1.PasswordResetModule,
            email_verification_module_1.EmailVerificationModule,
            commerce_module_1.CommerceModule,
            categories_module_1.CategoriesModule,
            brands_module_1.BrandsModule,
            attributes_module_1.AttributesModule,
            products_module_1.ProductsModule,
            product_variants_module_1.ProductVariantsModule,
            inventory_module_1.InventoryModule,
            warehouse_module_1.WarehouseModule,
            media_module_1.MediaModule,
            library_module_1.LibraryModule,
            search_module_1.SearchModule,
            me_module_1.MeModule,
            order_module_1.OrderModule,
            checkout_module_1.CheckoutModule,
            return_request_module_1.ReturnRequestModule,
            cancellation_module_1.CancellationModule,
            payment_module_1.PaymentModule,
            coupon_module_1.CouponModule,
            offer_module_1.OfferModule,
            shipping_module_1.ShippingModule,
            tax_module_1.TaxModule,
            invoice_module_1.InvoiceModule,
            refund_module_1.RefundModule,
            wallet_module_1.WalletModule,
            notification_module_1.NotificationModule,
            review_module_1.ReviewModule,
            cms_module_1.CmsModule,
            testimonials_module_1.TestimonialsModule,
            dashboard_module_1.DashboardModule,
            report_module_1.ReportModule,
            storefront_module_1.StorefrontModule,
            app_setting_module_1.AppSettingModule,
            support_module_1.SupportModule,
            faq_module_1.FaqModule,
            campaign_module_1.CampaignModule,
            ai_chat_module_1.AiChatModule,
            size_chart_module_1.SizeChartModule,
            ai_search_module_1.AiSearchModule,
            ai_recommendation_module_1.AiRecommendationModule,
            ai_analytics_module_1.AiAnalyticsModule,
            ai_admin_module_1.AiAdminModule,
            social_module_1.SocialModule,
            rag_agent_module_1.RagAgentModule,
            rag_knowledge_module_1.RagKnowledgeModule,
            feature_gate_module_1.FeatureGateModule,
            otp_module_1.OtpModule,
            otp_gateway_module_1.OtpGatewayModule,
            loyalty_module_1.LoyaltyModule,
            gift_card_module_1.GiftCardModule,
            referral_module_1.ReferralModule,
            recently_viewed_module_1.RecentlyViewedModule,
            packing_module_1.PackingModule,
            sms_module_1.SmsModule,
            email_module_1.EmailModule,
            push_notification_module_1.PushNotificationModule,
            dtdc_module_1.DtdcModule,
            pos_module_1.PosModule,
            quotation_module_1.QuotationModule,
            aws_billing_module_1.AwsBillingModule,
            analytics_module_1.AnalyticsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: http_logging_interceptor_1.HttpLoggingInterceptor,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: global_response_interceptor_1.GlobalResponseInterceptor,
            },
            {
                provide: core_1.APP_FILTER,
                useClass: global_exception_filter_1.GlobalExceptionFilter,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map