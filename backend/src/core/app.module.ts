import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule as AppConfigModule } from '@config/config.module';
import { DatabaseModule } from '@database/database.module';
import { LoggerModule } from '@common/logger/logger.module';
import { RedisModule } from '@infrastructure/redis/redis.module';
import { QueuesModule } from '@infrastructure/queues/queues.module';
import { StorageModule } from '@infrastructure/storage/storage.module';
import { CorrelationIdMiddleware } from '@common/middleware/correlation-id.middleware';
import { SecurityModule } from '@common/security/security.module';
import { HttpLoggingInterceptor } from '@common/interceptors/http-logging.interceptor';
import { GlobalResponseInterceptor } from '@common/interceptors/global-response.interceptor';
import { StartupModule } from '@common/startup/startup.module';
import { GlobalExceptionFilter } from '@common/filters/global-exception.filter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { IdentityModule } from '@shared/identity/identity.module';
import { AuthModule } from '@domains/auth/auth.module';
import { UsersModule } from '@domains/users/users.module';
import { RolesModule } from '@domains/roles/roles.module';
import { PermissionsModule } from '@domains/permissions/permissions.module';
import { StaffModule } from '@domains/staff/staff.module';
import { AuditModule } from '@domains/audit/audit.module';
import { SessionModule } from '@domains/session/session.module';
import { PasswordResetModule } from '@domains/password-reset/password-reset.module';
import { EmailVerificationModule } from '@domains/email-verification/email-verification.module';
import { CommerceModule } from '@shared/commerce/commerce.module';
import { CategoriesModule } from '@domains/categories/categories.module';
import { BrandsModule } from '@domains/brands/brands.module';
import { AttributesModule } from '@domains/attributes/attributes.module';
import { ProductsModule } from '@domains/products/products.module';
import { ProductVariantsModule } from '@domains/product-variants/product-variants.module';
import { InventoryModule } from '@domains/inventory/inventory.module';
import { WarehouseModule } from '@domains/warehouse/warehouse.module';
import { MediaModule } from '@domains/media/media.module';
import { LibraryModule } from '@domains/library/library.module';
import { SearchModule } from '@domains/search/search.module';
import { MeModule } from '@domains/me/me.module';
import { OrderModule } from '@domains/order/order.module';
import { CheckoutModule } from '@domains/checkout/checkout.module';
import { ReturnRequestModule } from '@domains/return-request/return-request.module';
import { CancellationModule } from '@domains/cancellation/cancellation.module';
import { PaymentModule } from '@domains/payment/payment.module';
import { CouponModule } from '@domains/coupon/coupon.module';
import { OfferModule } from '@domains/offer/offer.module';
import { ShippingModule } from '@domains/shipping/shipping.module';
import { TaxModule } from '@domains/tax/tax.module';
import { InvoiceModule } from '@domains/invoice/invoice.module';
import { RefundModule } from '@domains/refund/refund.module';
import { WalletModule } from '@domains/wallet/wallet.module';
import { NotificationModule } from '@domains/notification/notification.module';
import { ReviewModule } from '@domains/review/review.module';
import { CmsModule } from '@domains/cms/cms.module';
import { DashboardModule } from '@domains/dashboard/dashboard.module';
import { ReportModule } from '@domains/report/report.module';
import { AppSettingModule } from '@domains/app-setting/app-setting.module';
import { SupportModule } from '@domains/support/support.module';
import { FaqModule } from '@domains/faq/faq.module';
import { CampaignModule } from '@domains/campaign/campaign.module';
import { AiChatModule } from '@domains/ai-chat/ai-chat.module';
import { SizeChartModule } from '@domains/size-chart/size-chart.module';
import { PrescriptionModule } from '@domains/prescription/prescription.module';
import { DrugInteractionModule } from '@domains/drug-interaction/drug-interaction.module';
import { AiSearchModule } from '@domains/ai-search/ai-search.module';
import { AiRecommendationModule } from '@domains/ai-recommendation/ai-recommendation.module';
import { AiAnalyticsModule } from '@domains/ai-analytics/ai-analytics.module';
import { AiAdminModule } from '@domains/ai-admin/ai-admin.module';
import { SocialModule } from '@domains/social/social.module';
import { RagAgentModule } from '../domains/rag-agent/rag-agent.module';
import { RagKnowledgeModule } from '../domains/rag-knowledge/rag-knowledge.module';
import { StorefrontModule } from '../modules/storefront/storefront.module';
import { FeatureGateModule } from '@common/feature-gate/feature-gate.module';
import { OtpModule } from '@domains/otp/otp.module';
import { OtpGatewayModule } from '@domains/otp-gateway/otp-gateway.module';
import { LoyaltyModule } from '@domains/loyalty/loyalty.module';
import { GiftCardModule } from '@domains/gift-card/gift-card.module';
import { ReferralModule } from '@domains/referral/referral.module';
import { RecentlyViewedModule } from '@domains/recently-viewed/recently-viewed.module';
import { PackingModule } from '@domains/packing/packing.module';
import { SmsModule } from '@domains/sms/sms.module';
import { EmailModule } from '@domains/email/email.module';
import { PushNotificationModule } from '@domains/push-notification/push-notification.module';
import { DtdcModule } from '@domains/dtdc/dtdc.module';
import { PosModule } from '@domains/pos/pos.module';

/**
 * Root Application Module coordinates core global services (config, database, caching, health, queues).
 * Applies global correlation tracking middleware and security modules.
 */
@Module({
  imports: [
    // Global Config Module
    AppConfigModule,

    // Global Logger Module
    LoggerModule,

    // Global Throttler Module configuration
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('app.throttle.ttl', 60) * 1000,
          limit: configService.get<number>('app.throttle.limit', 100),
        },
      ],
    }),

    // Global Security Module (contains global throttler guard registration)
    SecurityModule,

    // Startup Dashboard
    StartupModule,

    // Base database layer
    DatabaseModule,

    // Caching/In-Memory Cache Layer
    RedisModule,

    // Background job queues
    QueuesModule,

    // File Storage Layer
    StorageModule,

    // Subsystem Health monitors
    HealthModule,

    // Application metrics and monitoring
    MonitoringModule,

    // === Identity Layer ===

    // Shared Identity types, enums, constants, and utilities
    IdentityModule,

    // Identity Domain Modules
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    StaffModule,
    AuditModule,
    SessionModule,
    PasswordResetModule,
    EmailVerificationModule,

    // === Commerce Layer (Phase 2.0) ===

    // Shared Commerce types, enums, constants, and utilities
    CommerceModule,

    // Commerce Domain Modules
    CategoriesModule,
    BrandsModule,
    AttributesModule,
    ProductsModule,
    ProductVariantsModule,
    InventoryModule,
    WarehouseModule,
    MediaModule,
    LibraryModule,
    SearchModule,

    // Customer Experience Layer (Phase 3.0)
    MeModule,

    // Order Layer (Phase 4.0)
    OrderModule,
    CheckoutModule,
    ReturnRequestModule,
    CancellationModule,

    // Payments & Business Operations (Phase 5.0)
    PaymentModule,
    CouponModule,
    OfferModule,
    ShippingModule,
    TaxModule,
    InvoiceModule,
    RefundModule,
    WalletModule,

    // Operations, Marketing, CMS, Reports, Dashboard, Settings (Phase 6.0)
    NotificationModule,
    ReviewModule,
    CmsModule,
    DashboardModule,
    ReportModule,
    StorefrontModule,
    AppSettingModule,
    SupportModule,
    FaqModule,
    CampaignModule,

    // AI Platform (Phase 7.0)
    AiChatModule,
    SizeChartModule,
    PrescriptionModule,
    DrugInteractionModule,
    AiSearchModule,
    AiRecommendationModule,
    AiAnalyticsModule,
    AiAdminModule,
    SocialModule,
    RagAgentModule,
    RagKnowledgeModule,

    // Storefront Management (Phase 10.0)

    // Feature gate + Phase 11 commerce extensions
    FeatureGateModule,
    OtpModule,
    OtpGatewayModule,
    LoyaltyModule,
    GiftCardModule,
    ReferralModule,
    RecentlyViewedModule,
    PackingModule,
    SmsModule,
    EmailModule,
    PushNotificationModule,
    DtdcModule,
    PosModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: GlobalResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  /**
   * Configures middleware components.
   */
  configure(consumer: MiddlewareConsumer) {
    // Apply correlation tracking middleware to all routes
    consumer.apply(CorrelationIdMiddleware).forRoutes('*path');
  }
}
