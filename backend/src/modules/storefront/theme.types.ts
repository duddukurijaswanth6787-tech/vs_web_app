import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';

/**
 * Per-section colours for the storefront, set by the super admin.
 *
 * Every value ends up inside a <style> block on the customer-facing pages, so
 * a value that is not a colour is a CSS injection: `red;} body{display:none` in
 * a colour field would close the rule and start a new one. Values are matched
 * against a strict hex pattern before they are stored and again before they
 * are rendered -- see isHexColor.
 */
export const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR.test(value.trim());
}

/**
 * The sections a colour can be set for, and the CSS variable each one drives.
 * Adding a section here is all it takes for it to appear in the admin screen
 * and to be injected on the storefront.
 */
export const THEME_TOKENS = {
  // Brand -- the colour used for buttons, links and active states everywhere.
  'brand-primary': '#0284c7',
  'brand-primary-dark': '#0B3B78',
  'brand-on-primary': '#ffffff',

  'page-bg': '#FDFBFB',

  'announcement-bg': '#0284c7',
  'announcement-text': '#ffffff',

  'header-bg': '#ffffff',
  'header-text': '#171717',
  'header-border': '#e5e5e5',

  'hero-bg': '#EAF4FF',
  'hero-text': '#171717',

  'category-bg': '#ffffff',
  'category-text': '#171717',

  'product-card-bg': '#ffffff',
  'product-card-text': '#171717',
  'product-price': '#0284c7',

  'benefits-bg': '#EAF4FF',
  'benefits-text': '#171717',

  'testimonials-bg': '#ffffff',
  'testimonials-text': '#171717',

  'newsletter-bg': '#0A2138',
  'newsletter-text': '#ffffff',

  'footer-bg': '#0A2138',
  'footer-text': '#DCEBFA',
  'footer-heading': '#ffffff',
  'footer-link-hover': '#ffffff',
} as const;

export type ThemeToken = keyof typeof THEME_TOKENS;

/** Groups the tokens for display. Labels are what the admin screen shows. */
export const THEME_SECTIONS: {
  key: string;
  label: string;
  tokens: { token: ThemeToken; label: string }[];
}[] = [
  {
    key: 'brand',
    label: 'Brand & Buttons',
    tokens: [
      { token: 'brand-primary', label: 'Primary colour' },
      { token: 'brand-primary-dark', label: 'Primary hover' },
      { token: 'brand-on-primary', label: 'Text on primary' },
      { token: 'page-bg', label: 'Page background' },
    ],
  },
  {
    key: 'announcement',
    label: 'Announcement Bar',
    tokens: [
      { token: 'announcement-bg', label: 'Background' },
      { token: 'announcement-text', label: 'Text' },
    ],
  },
  {
    key: 'header',
    label: 'Header',
    tokens: [
      { token: 'header-bg', label: 'Background' },
      { token: 'header-text', label: 'Text & icons' },
      { token: 'header-border', label: 'Bottom border' },
    ],
  },
  {
    key: 'hero',
    label: 'Hero Banner',
    tokens: [
      { token: 'hero-bg', label: 'Background' },
      { token: 'hero-text', label: 'Text' },
    ],
  },
  {
    key: 'category',
    label: 'Category Circles',
    tokens: [
      { token: 'category-bg', label: 'Background' },
      { token: 'category-text', label: 'Text' },
    ],
  },
  {
    key: 'product',
    label: 'Product Cards',
    tokens: [
      { token: 'product-card-bg', label: 'Card background' },
      { token: 'product-card-text', label: 'Card text' },
      { token: 'product-price', label: 'Price' },
    ],
  },
  {
    key: 'benefits',
    label: 'Benefits Strip',
    tokens: [
      { token: 'benefits-bg', label: 'Background' },
      { token: 'benefits-text', label: 'Text' },
    ],
  },
  {
    key: 'testimonials',
    label: 'Testimonials',
    tokens: [
      { token: 'testimonials-bg', label: 'Background' },
      { token: 'testimonials-text', label: 'Text' },
    ],
  },
  {
    key: 'newsletter',
    label: 'Newsletter',
    tokens: [
      { token: 'newsletter-bg', label: 'Background' },
      { token: 'newsletter-text', label: 'Text' },
    ],
  },
  {
    key: 'footer',
    label: 'Footer',
    tokens: [
      { token: 'footer-bg', label: 'Background' },
      { token: 'footer-text', label: 'Text' },
      { token: 'footer-heading', label: 'Headings' },
      { token: 'footer-link-hover', label: 'Link hover' },
    ],
  },
];

export class UpdateStorefrontThemeDto {
  @ApiPropertyOptional({
    description:
      'Map of theme token to hex colour. Unknown tokens and non-hex values are rejected.',
    example: { 'brand-primary': '#0284c7', 'footer-bg': '#0A2138' },
  })
  @IsOptional()
  @IsObject()
  colors?: Record<string, string>;
}

export class StorefrontThemeResponse {
  @ApiProperty() colors!: Record<string, string>;
  @ApiProperty() defaults!: Record<string, string>;
  @ApiProperty() sections!: typeof THEME_SECTIONS;
}
