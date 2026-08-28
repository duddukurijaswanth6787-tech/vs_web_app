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
exports.PromptTemplateBody = exports.PromptHistoryEntry = exports.PromptTemplatesResponse = exports.UpdatePromptTemplateDto = exports.DEFAULT_TEMPLATES = exports.ACCURACY_RULE = exports.PROMPT_VARIABLES = exports.PROMPT_TYPES = void 0;
exports.extractVariables = extractVariables;
exports.unsupportedVariables = unsupportedVariables;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
exports.PROMPT_TYPES = [
    'PRODUCT_TITLE',
    'PRODUCT_DESCRIPTION',
    'SHORT_DESCRIPTION',
    'SEO_TITLE',
    'META_DESCRIPTION',
    'IMAGE_GENERATION',
    'IMAGE_ALT_TEXT',
    'SOCIAL_CAPTION',
];
exports.PROMPT_VARIABLES = [
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
];
exports.ACCURACY_RULE = 'Use only the product information provided above. Do not invent, assume, or fabricate missing product information — including fabric, colour, measurements, size, fit, embroidery, embellishments, design details, manufacturing details, or care instructions. If a detail is not listed above, do not mention it.';
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
const withFieldsAndRules = (intro, rulesLabel = 'RULES') => `${intro}\n\nPRODUCT INFORMATION:\n{{product_fields}}\n\n${rulesLabel}:\n{{rules}}`;
exports.DEFAULT_TEMPLATES = {
    PRODUCT_DESCRIPTION: {
        type: 'PRODUCT_DESCRIPTION',
        name: 'Product Description',
        template: `${withFieldsAndRules("Generate a premium e-commerce product description for the following women's fashion product.")}\n\nReturn only the final product description.`,
        rules: DESCRIPTION_RULES,
        status: 'ACTIVE',
        version: 1,
        updatedAt: '',
    },
    SHORT_DESCRIPTION: {
        type: 'SHORT_DESCRIPTION',
        name: 'Short Description',
        template: `${withFieldsAndRules("Write a one or two sentence short description for the following women's fashion product, for use on listing cards.")}\n\nKeep it under 200 characters. Return only the short description.`,
        rules: DESCRIPTION_RULES,
        status: 'ACTIVE',
        version: 1,
        updatedAt: '',
    },
    PRODUCT_TITLE: {
        type: 'PRODUCT_TITLE',
        name: 'Product Title',
        template: `${withFieldsAndRules("Write a clear, appealing product title for the following women's fashion product.")}\n\nKeep it under 80 characters. Return only the title.`,
        rules: DESCRIPTION_RULES,
        status: 'ACTIVE',
        version: 1,
        updatedAt: '',
    },
    SEO_TITLE: {
        type: 'SEO_TITLE',
        name: 'SEO Title',
        template: `${withFieldsAndRules('Write an SEO page title for the following product.', 'SEO RULES')}\n\nKeep it between 50 and 60 characters. Return only the title.`,
        rules: SEO_RULES,
        status: 'ACTIVE',
        version: 1,
        updatedAt: '',
    },
    META_DESCRIPTION: {
        type: 'META_DESCRIPTION',
        name: 'SEO Meta Description',
        template: `${withFieldsAndRules('Write an SEO meta description for the following product.', 'SEO RULES')}\n\nKeep it between 140 and 160 characters. Return only the meta description.`,
        rules: SEO_RULES,
        status: 'ACTIVE',
        version: 1,
        updatedAt: '',
    },
    IMAGE_GENERATION: {
        type: 'IMAGE_GENERATION',
        name: 'Image Generation',
        template: `${withFieldsAndRules("Create a professional women's fashion e-commerce product image using the following available product information.", 'IMAGE RULES')}\n\nPreserve the actual product characteristics provided. Do not change or invent important product characteristics. Do not add text. Do not add watermarks. Use a premium commercial fashion photography style.`,
        rules: IMAGE_RULES,
        status: 'ACTIVE',
        version: 1,
        updatedAt: '',
    },
    IMAGE_ALT_TEXT: {
        type: 'IMAGE_ALT_TEXT',
        name: 'Image Alt Text',
        template: `${withFieldsAndRules('Write accessible alt text describing the product image for the following product.', 'SEO RULES')}\n\nDescribe only what the product information states. Keep it under 125 characters. Return only the alt text.`,
        rules: SEO_RULES,
        status: 'ACTIVE',
        version: 1,
        updatedAt: '',
    },
    SOCIAL_CAPTION: {
        type: 'SOCIAL_CAPTION',
        name: 'Social Media Caption',
        template: `${withFieldsAndRules("Write an Instagram caption for the following women's fashion product.")}\n\nInclude 3 to 5 relevant hashtags. Return only the caption.`,
        rules: DESCRIPTION_RULES,
        status: 'ACTIVE',
        version: 1,
        updatedAt: '',
    },
};
function extractVariables(template) {
    return [...template.matchAll(/\{\{\s*([a-z_]+)\s*\}\}/gi)].map((m) => m[1].toLowerCase());
}
function unsupportedVariables(template) {
    const known = new Set(exports.PROMPT_VARIABLES);
    return [...new Set(extractVariables(template))].filter((v) => !known.has(v));
}
class UpdatePromptTemplateDto {
    name;
    template;
    rules;
    status;
}
exports.UpdatePromptTemplateDto = UpdatePromptTemplateDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePromptTemplateDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePromptTemplateDto.prototype, "template", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePromptTemplateDto.prototype, "rules", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['ACTIVE', 'INACTIVE'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['ACTIVE', 'INACTIVE']),
    __metadata("design:type", String)
], UpdatePromptTemplateDto.prototype, "status", void 0);
class PromptTemplatesResponse {
    templates;
    variables;
    accuracyRule;
}
exports.PromptTemplatesResponse = PromptTemplatesResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Array)
], PromptTemplatesResponse.prototype, "templates", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Array)
], PromptTemplatesResponse.prototype, "variables", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PromptTemplatesResponse.prototype, "accuracyRule", void 0);
class PromptHistoryEntry {
    version;
    updatedAt;
    updatedBy;
    template;
    rules;
}
exports.PromptHistoryEntry = PromptHistoryEntry;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PromptHistoryEntry.prototype, "version", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PromptHistoryEntry.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], PromptHistoryEntry.prototype, "updatedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PromptHistoryEntry.prototype, "template", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PromptHistoryEntry.prototype, "rules", void 0);
class PromptTemplateBody {
    body;
}
exports.PromptTemplateBody = PromptTemplateBody;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], PromptTemplateBody.prototype, "body", void 0);
//# sourceMappingURL=ai-prompt.types.js.map