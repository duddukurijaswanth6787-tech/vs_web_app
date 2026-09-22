/**
 * High-definition luxury curated images for store categories
 * Ensures no category renders as a blank gray box or with "Empty" text.
 */
const CATEGORY_IMAGE_FALLBACKS: Record<string, string> = {
  // Dresses & Western
  'dresses': 'https://vasanthi-signature-images.s3.ap-south-2.amazonaws.com/products/2262f4ab-f543-41f9-a034-fa1d3981586c.webp',
  'casual-dresses': 'https://vasanthi-signature-images.s3.ap-south-2.amazonaws.com/products/aa5027c3-e8be-4744-87c9-f6a674ab339c.webp',
  'party-wear-dresses': 'https://vasanthi-signature-images.s3.ap-south-2.amazonaws.com/products/f59eac27-39b4-4cbc-878c-725a9af94f63.webp',
  'western-wear': 'https://vasanthi-signature-images.s3.ap-south-2.amazonaws.com/products/d3adfb63-a449-4021-bde9-5515ea9b73d3.webp',
  '2-3-years': 'https://vasanthi-signature-images.s3.ap-south-2.amazonaws.com/products/91e0120b-7e2d-44a5-8c04-212f8bf064ee.webp',

  // Ethnic & Designer
  'anarkalis': 'https://vasanthi-signature-images.s3.ap-south-2.amazonaws.com/products/57f5d8c0-0f9e-43d6-b96d-178edf961e2b.webp',
  'ethnic-wear': 'https://vasanthi-signature-images.s3.ap-south-2.amazonaws.com/products/187482eb-b144-4c00-9568-ce50339a98a4.webp',
  'lehengas': 'https://vasanthi-signature-images.s3.ap-south-2.amazonaws.com/products/1029672c-a6fa-43da-bcca-25bee15ebee7.webp',
  'kurtis-suits': 'https://vasanthi-signature-images.s3.ap-south-2.amazonaws.com/products/91e0120b-7e2d-44a5-8c04-212f8bf064ee.webp',
  'kurta-sets': 'https://vasanthi-signature-images.s3.ap-south-2.amazonaws.com/products/2262f4ab-f543-41f9-a034-fa1d3981586c.webp',
  'sharara-sets': 'https://vasanthi-signature-images.s3.ap-south-2.amazonaws.com/products/aa5027c3-e8be-4744-87c9-f6a674ab339c.webp',

  // Collections
  'festive-collection': 'https://vasanthi-signature-images.s3.ap-south-2.amazonaws.com/products/f59eac27-39b4-4cbc-878c-725a9af94f63.webp',
  'wedding-collection': 'https://vasanthi-signature-images.s3.ap-south-2.amazonaws.com/products/d3adfb63-a449-4021-bde9-5515ea9b73d3.webp',
  'party-wear': 'https://vasanthi-signature-images.s3.ap-south-2.amazonaws.com/products/1029672c-a6fa-43da-bcca-25bee15ebee7.webp',
  'summer-collection': 'https://vasanthi-signature-images.s3.ap-south-2.amazonaws.com/products/187482eb-b144-4c00-9568-ce50339a98a4.webp',
  'winter-collection': 'https://vasanthi-signature-images.s3.ap-south-2.amazonaws.com/products/57f5d8c0-0f9e-43d6-b96d-178edf961e2b.webp',
  'sale': 'https://vasanthi-signature-images.s3.ap-south-2.amazonaws.com/products/2262f4ab-f543-41f9-a034-fa1d3981586c.webp',
};

const DEFAULT_CATEGORY_IMAGE = 'https://vasanthi-signature-images.s3.ap-south-2.amazonaws.com/products/2262f4ab-f543-41f9-a034-fa1d3981586c.webp';

export function getCategoryFallbackImage(slug?: string, name?: string): string {
  if (!slug && !name) return DEFAULT_CATEGORY_IMAGE;
  
  const cleanSlug = (slug || '').toLowerCase().trim();
  if (CATEGORY_IMAGE_FALLBACKS[cleanSlug]) {
    return CATEGORY_IMAGE_FALLBACKS[cleanSlug];
  }

  // Name keyword matching
  const cleanName = (name || '').toLowerCase();
  for (const [key, url] of Object.entries(CATEGORY_IMAGE_FALLBACKS)) {
    if (cleanSlug.includes(key) || cleanName.includes(key.replace(/-/g, ' '))) {
      return url;
    }
  }

  return DEFAULT_CATEGORY_IMAGE;
}
