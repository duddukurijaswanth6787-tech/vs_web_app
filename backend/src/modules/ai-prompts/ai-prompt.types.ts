import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export const PROMPT_TYPES = [
  'PRODUCT_TITLE',
  'PRODUCT_DESCRIPTION',
  'SHORT_DESCRIPTION',
  'SEO_TITLE',
  'META_DESCRIPTION',
  'IMAGE_GENERATION',
  'IMAGE_ALT_TEXT',
  'SOCIAL_CAPTION',
] as const;

export type PromptType = (typeof PROMPT_TYPES)[number];

/**
 * Variables a template may reference. `product_fields` is the assembled block
 * of whatever the product actually has; the rest are single values, offered so
 * a template can weave one into a sentence.
 *
 * Anything outside this list is a typo, and a typo left in an active template
 * ships a literal `{{fabrik}}` into a prompt someone pastes into ChatGPT.
 */
export const PROMPT_VARIABLES = [
  'product_fields',
  'rules',
  'product_name',
  'category',
  'subcategory',
  'fabric',
  'color',
  'pattern',
  'occasion',
  'fit',
  'sleeve',
  'neck',
  'material',
  'brand',
  'collection',
  'tags',
] as const;

export interface PromptTemplate {
  type: PromptType;
  name: string;
  template: string;
  rules: string;
  status: 'ACTIVE' | 'INACTIVE';
  version: number;
  updatedAt: string;
  updatedBy?: string;
}

/**
 * The accuracy rule, appended to every prompt regardless of what the template
 * says. The whole point of the feature is copy that does not invent a fabric
 * the shop never entered, so this is not left to a template someone can edit
 * it out of.
 */
export const ACCURACY_RULE =
  'Use only the product information provided above. Do not invent, assume, or fabricate missing product information — including fabric, colour, measurements, size, fit, embroidery, embellishments, design details, manufacturing details, or care instructions. If a detail is not listed above, do not mention it.';

const DESCRIPTION_RULES = `- Write for a women's fashion e-commerce store.
- Use elegant and natural language.
- Keep the description concise and useful.
- Do not invent missing product specifications.
- Do not make unsupported claims.
- Do not mention information that was not provided.
- Avoid excessive repetition.
- Avoid unnecessary emojis.
- Focus on the product's actual characteristics.
- Make the copy easy to understand.
- Return only the requested content.`;

const IMAGE_RULES = `- Premium women's fashion e-commerce photography.
- Product should be the visual focus.
- Preserve provided product characteristics.
- Do not invent important garment details.
- No text.
- No watermark.
- Clean professional composition.
- Suitable for an online fashion store.
- Use the requested image aspect ratio.
- Keep the product visually clear.`;

const SEO_RULES = `- Use natural keywords.
- Do not keyword stuff.
- Use only product/category information that is provided.
- Do not invent specifications.
- Keep title and meta description concise.
- Make content suitable for an e-commerce website.`;

const withFieldsAndRules = (intro: string, rulesLabel = 'RULES') =>
  `${intro}\n\nPRODUCT INFORMATION:\n{{product_fields}}\n\n${rulesLabel}:\n{{rules}}`;

export const DEFAULT_TEMPLATES: Record<PromptType, PromptTemplate> = {
  PRODUCT_DESCRIPTION: {
    type: 'PRODUCT_DESCRIPTION',
    name: 'Product Description',
    template: `${withFieldsAndRules(
      "Generate a premium e-commerce product description for the following women's fashion product.",
    )}\n\nReturn only the final product description.`,
    rules: DESCRIPTION_RULES,
    status: 'ACTIVE',
    version: 1,
    updatedAt: '',
  },
  SHORT_DESCRIPTION: {
    type: 'SHORT_DESCRIPTION',
    name: 'Short Description',
    template: `${withFieldsAndRules(
      "Write a one or two sentence short description for the following women's fashion product, for use on listing cards.",
    )}\n\nKeep it under 200 characters. Return only the short description.`,
    rules: DESCRIPTION_RULES,
    status: 'ACTIVE',
    version: 1,
    updatedAt: '',
  },
  PRODUCT_TITLE: {
    type: 'PRODUCT_TITLE',
    name: 'Product Title',
    template: `${withFieldsAndRules(
      "Write a clear, appealing product title for the following women's fashion product.",
    )}\n\nKeep it under 80 characters. Return only the title.`,
    rules: DESCRIPTION_RULES,
    status: 'ACTIVE',
    version: 1,
    updatedAt: '',
  },
  SEO_TITLE: {
    type: 'SEO_TITLE',
    name: 'SEO Title',
    template: `${withFieldsAndRules(
      'Write an SEO page title for the following product.',
      'SEO RULES',
    )}\n\nKeep it between 50 and 60 characters. Return only the title.`,
    rules: SEO_RULES,
    status: 'ACTIVE',
    version: 1,
    updatedAt: '',
  },
  META_DESCRIPTION: {
    type: 'META_DESCRIPTION',
    name: 'SEO Meta Description',
    template: `${withFieldsAndRules(
      'Write an SEO meta description for the following product.',
      'SEO RULES',
    )}\n\nKeep it between 140 and 160 characters. Return only the meta description.`,
    rules: SEO_RULES,
    status: 'ACTIVE',
    version: 1,
    updatedAt: '',
  },
  IMAGE_GENERATION: {
    type: 'IMAGE_GENERATION',
    name: 'Image Generation',
    template: `${withFieldsAndRules(
      "Create a professional women's fashion e-commerce product image using the following available product information.",
      'IMAGE RULES',
    )}\n\nPreserve the actual product characteristics provided. Do not change or invent important product characteristics. Do not add text. Do not add watermarks. Use a premium commercial fashion photography style.`,
    rules: IMAGE_RULES,
    status: 'ACTIVE',
    version: 1,
    updatedAt: '',
  },
  IMAGE_ALT_TEXT: {
    type: 'IMAGE_ALT_TEXT',
    name: 'Image Alt Text',
    template: `${withFieldsAndRules(
      'Write accessible alt text describing the product image for the following product.',
      'SEO RULES',
    )}\n\nDescribe only what the product information states. Keep it under 125 characters. Return only the alt text.`,
    rules: SEO_RULES,
    status: 'ACTIVE',
    version: 1,
    updatedAt: '',
  },
  SOCIAL_CAPTION: {
    type: 'SOCIAL_CAPTION',
    name: 'Social Media Caption',
    template: `${withFieldsAndRules(
      "Write an Instagram caption for the following women's fashion product.",
    )}\n\nInclude 3 to 5 relevant hashtags. Return only the caption.`,
    rules: DESCRIPTION_RULES,
    status: 'ACTIVE',
    version: 1,
    updatedAt: '',
  },
};

/** `{{ variable }}` occurrences, tolerating inner whitespace. */
export function extractVariables(template: string): string[] {
  return [...template.matchAll(/\{\{\s*([a-z_]+)\s*\}\}/gi)].map((m) =>
    m[1].toLowerCase(),
  );
}

export function unsupportedVariables(template: string): string[] {
  const known = new Set<string>(PROMPT_VARIABLES);
  return [...new Set(extractVariables(template))].filter((v) => !known.has(v));
}

export class UpdatePromptTemplateDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() template?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() rules?: string;
  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE';
}

export class PromptTemplatesResponse {
  @ApiProperty() templates!: PromptTemplate[];
  @ApiProperty() variables!: string[];
  @ApiProperty() accuracyRule!: string;
}

export class PromptHistoryEntry {
  @ApiProperty() version!: number;
  @ApiProperty() updatedAt!: string;
  @ApiPropertyOptional() updatedBy?: string;
  @ApiProperty() template!: string;
  @ApiProperty() rules!: string;
}

export class PromptTemplateBody {
  @ApiPropertyOptional() @IsOptional() @IsObject() body?: Record<string, unknown>;
}
