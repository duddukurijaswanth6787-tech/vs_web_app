import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { CacheService } from '@infrastructure/redis';
import { BusinessException } from '@common/exceptions';
import { NewsletterSubscribeDto } from './storefront.types';

@Injectable()
export class StorefrontPublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async getPublicSettings() {
    return this.cache.getOrSet(
      'storefront:settings',
      async () => {
        const settings =
          (await this.prisma.websiteSetting.findFirst({
            where: { deletedAt: null },
          })) ?? (await this.prisma.websiteSetting.create({ data: {} }));
        const [
          autoplaySetting,
          enabledSetting,
          mobileAnnouncementSetting,
          announcementTextSetting,
          announcementEnabledSetting,
          announcementLinkSetting,
          announcementLinkTextSetting,
          announcementBgColorSetting,
          announcementTextColorSetting,
        ] = await Promise.all([
          this.prisma.appSetting.findUnique({
            where: { key: 'banner_autoplay_interval' },
          }),
          this.prisma.appSetting.findUnique({
            where: { key: 'banner_autoplay_enabled' },
          }),
          this.prisma.appSetting.findUnique({
            where: { key: 'announcement_bar_mobile_enabled' },
          }),
          this.prisma.appSetting.findUnique({
            where: { key: 'announcement_bar_text' },
          }),
          this.prisma.appSetting.findUnique({
            where: { key: 'announcement_bar_enabled' },
          }),
          this.prisma.appSetting.findUnique({
            where: { key: 'announcement_bar_link' },
          }),
          this.prisma.appSetting.findUnique({
            where: { key: 'announcement_bar_link_text' },
          }),
          this.prisma.appSetting.findUnique({
            where: { key: 'announcement_bar_bg_color' },
          }),
          this.prisma.appSetting.findUnique({
            where: { key: 'announcement_bar_text_color' },
          }),
        ]);
        const announcementText = announcementTextSetting?.value || 'Festive Sale is Live! Get up to 30% OFF';
        const mobileEnabled = mobileAnnouncementSetting ? mobileAnnouncementSetting.value === 'true' : true;
        const autoplayInterval = autoplaySetting ? parseInt(autoplaySetting.value, 10) : 5;
        const autoplayEnabled = enabledSetting ? enabledSetting.value === 'true' : true;
        const announcementEnabled = announcementEnabledSetting ? announcementEnabledSetting.value === 'true' : true;
        const announcementLink = announcementLinkSetting?.value || '/offers';
        const announcementLinkText = announcementLinkTextSetting?.value || 'Shop Now →';
        const announcementBgColor = announcementBgColorSetting?.value || '#800020';
        const announcementTextColor = announcementTextColorSetting?.value || '#FFFFFF';

        return {
          ...settings,
          bannerAutoplayInterval: autoplayInterval,
          bannerAutoplayEnabled: autoplayEnabled,
          announcementBarEnabled: announcementEnabled,
          announcementBarMobileEnabled: mobileEnabled,
          announcementBarText: announcementText,
          announcementBarLink: announcementLink,
          announcementBarLinkText: announcementLinkText,
          announcementBarBgColor: announcementBgColor,
          announcementBarTextColor: announcementTextColor,
          announcement_bar_enabled: announcementEnabled,
          announcement_bar_text: announcementText,
          announcement_bar_mobile_enabled: mobileEnabled,
          announcement_bar_link: announcementLink,
          announcement_bar_link_text: announcementLinkText,
          announcement_bar_bg_color: announcementBgColor,
          announcement_bar_text_color: announcementTextColor,
          banner_autoplay_interval: autoplayInterval,
          banner_autoplay_enabled: autoplayEnabled,
        };
      },
      300,
    );
  }

  async getHomepage() {
    return this.cache.getOrSet(
      'storefront:homepage',
      async () => {
        const [sections, categories] = await Promise.all([
          this.prisma.homepageSection.findMany({
            where: { deletedAt: null, enabled: true },
            orderBy: { displayOrder: 'asc' },
          }),
          this.prisma.homepageCategory.findMany({
            orderBy: { displayOrder: 'asc' },
            include: { category: true },
          }),
        ]);
        return { sections, categories };
      },
      120,
    );
  }

  async getFooter() {
    return this.cache.getOrSet(
      'storefront:footer',
      async () =>
        this.prisma.footerSection.findMany({
          where: { enabled: true },
          orderBy: { displayOrder: 'asc' },
          include: {
            links: {
              where: { enabled: true },
              orderBy: { displayOrder: 'asc' },
            },
          },
        }),
      300,
    );
  }

  async getSocialLinks() {
    return this.cache.getOrSet(
      'storefront:social-links',
      async () =>
        this.prisma.socialLink.findMany({
          where: { enabled: true },
          orderBy: { displayOrder: 'asc' },
        }),
      300,
    );
  }

  async getFeatures() {
    return this.cache.getOrSet(
      'storefront:features',
      async () =>
        this.prisma.featureToggle.findMany({ orderBy: { category: 'asc' } }),
      300,
    );
  }

  async subscribeToNewsletter(dto: NewsletterSubscribeDto) {
    const existing = await this.prisma.newsletterSubscription.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      if (existing.status === 'SUBSCRIBED')
        throw new BusinessException('Email already subscribed', 'STF_010');
      return this.prisma.newsletterSubscription.update({
        where: { email: dto.email },
        data: {
          status: 'SUBSCRIBED',
          subscribedAt: new Date(),
          unsubscribedAt: null,
          source: dto.source ?? existing.source,
        },
      });
    }
    return this.prisma.newsletterSubscription.create({
      data: { email: dto.email, source: dto.source },
    });
  }
}
