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
exports.AdminReportsQueryDto = exports.AdminSocialQueryDto = exports.SocialReelsQueryDto = exports.SocialFeedQueryDto = exports.ResolveReportDto = exports.CreateReportDto = exports.CreateCommentDto = exports.SocialInteractionDto = exports.UpdatePostStatusDto = exports.UpdateSocialPostDto = exports.CreateSocialPostDto = exports.PostMediaDto = exports.ProductTagDto = exports.SocialInteractionAction = exports.SocialReportStatus = exports.SocialReportReason = exports.SocialMediaType = exports.SocialPostVisibility = exports.SocialPostStatus = exports.SocialPostContentType = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
var SocialPostContentType;
(function (SocialPostContentType) {
    SocialPostContentType["POST"] = "POST";
    SocialPostContentType["REEL"] = "REEL";
})(SocialPostContentType || (exports.SocialPostContentType = SocialPostContentType = {}));
var SocialPostStatus;
(function (SocialPostStatus) {
    SocialPostStatus["DRAFT"] = "DRAFT";
    SocialPostStatus["PUBLISHED"] = "PUBLISHED";
    SocialPostStatus["HIDDEN"] = "HIDDEN";
    SocialPostStatus["ARCHIVED"] = "ARCHIVED";
})(SocialPostStatus || (exports.SocialPostStatus = SocialPostStatus = {}));
var SocialPostVisibility;
(function (SocialPostVisibility) {
    SocialPostVisibility["PUBLIC"] = "PUBLIC";
    SocialPostVisibility["HIDDEN"] = "HIDDEN";
})(SocialPostVisibility || (exports.SocialPostVisibility = SocialPostVisibility = {}));
var SocialMediaType;
(function (SocialMediaType) {
    SocialMediaType["IMAGE"] = "IMAGE";
    SocialMediaType["VIDEO"] = "VIDEO";
})(SocialMediaType || (exports.SocialMediaType = SocialMediaType = {}));
var SocialReportReason;
(function (SocialReportReason) {
    SocialReportReason["SPAM"] = "SPAM";
    SocialReportReason["INAPPROPRIATE"] = "INAPPROPRIATE";
    SocialReportReason["MISLEADING"] = "MISLEADING";
    SocialReportReason["COPYRIGHT"] = "COPYRIGHT";
    SocialReportReason["OTHER"] = "OTHER";
})(SocialReportReason || (exports.SocialReportReason = SocialReportReason = {}));
var SocialReportStatus;
(function (SocialReportStatus) {
    SocialReportStatus["PENDING"] = "PENDING";
    SocialReportStatus["REVIEWED"] = "REVIEWED";
    SocialReportStatus["DISMISSED"] = "DISMISSED";
    SocialReportStatus["ACTION_TAKEN"] = "ACTION_TAKEN";
})(SocialReportStatus || (exports.SocialReportStatus = SocialReportStatus = {}));
var SocialInteractionAction;
(function (SocialInteractionAction) {
    SocialInteractionAction["LIKE"] = "LIKE";
    SocialInteractionAction["UNLIKE"] = "UNLIKE";
    SocialInteractionAction["SAVE"] = "SAVE";
    SocialInteractionAction["UNSAVE"] = "UNSAVE";
    SocialInteractionAction["SHARE"] = "SHARE";
    SocialInteractionAction["VIEW"] = "VIEW";
    SocialInteractionAction["PLAY"] = "PLAY";
    SocialInteractionAction["COMPLETE"] = "COMPLETE";
})(SocialInteractionAction || (exports.SocialInteractionAction = SocialInteractionAction = {}));
class ProductTagDto {
    productId;
    variantId;
    displayOrder;
    tagX;
    tagY;
    label;
}
exports.ProductTagDto = ProductTagDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ProductTagDto.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ProductTagDto.prototype, "variantId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ProductTagDto.prototype, "displayOrder", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0, { message: 'tagX must be between 0 and 100' }),
    (0, class_validator_1.Max)(100, { message: 'tagX must be between 0 and 100' }),
    __metadata("design:type", Number)
], ProductTagDto.prototype, "tagX", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0, { message: 'tagY must be between 0 and 100' }),
    (0, class_validator_1.Max)(100, { message: 'tagY must be between 0 and 100' }),
    __metadata("design:type", Number)
], ProductTagDto.prototype, "tagY", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProductTagDto.prototype, "label", void 0);
class PostMediaDto {
    mediaType;
    s3Key;
    url;
    thumbnailUrl;
    mediumUrl;
    largeUrl;
    mimeType;
    size;
    width;
    height;
    duration;
    displayOrder;
    altText;
}
exports.PostMediaDto = PostMediaDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: SocialMediaType }),
    (0, class_validator_1.IsEnum)(SocialMediaType),
    __metadata("design:type", String)
], PostMediaDto.prototype, "mediaType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PostMediaDto.prototype, "s3Key", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], PostMediaDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], PostMediaDto.prototype, "thumbnailUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], PostMediaDto.prototype, "mediumUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], PostMediaDto.prototype, "largeUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PostMediaDto.prototype, "mimeType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PostMediaDto.prototype, "size", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PostMediaDto.prototype, "width", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PostMediaDto.prototype, "height", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.1),
    __metadata("design:type", Number)
], PostMediaDto.prototype, "duration", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], PostMediaDto.prototype, "displayOrder", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PostMediaDto.prototype, "altText", void 0);
class CreateSocialPostDto {
    contentType;
    caption;
    hashtags;
    visibility;
    allowComments;
    productIds;
}
exports.CreateSocialPostDto = CreateSocialPostDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: SocialPostContentType }),
    (0, class_validator_1.IsEnum)(SocialPostContentType),
    __metadata("design:type", String)
], CreateSocialPostDto.prototype, "contentType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSocialPostDto.prototype, "caption", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateSocialPostDto.prototype, "hashtags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: SocialPostVisibility,
        default: SocialPostVisibility.PUBLIC,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SocialPostVisibility),
    __metadata("design:type", String)
], CreateSocialPostDto.prototype, "visibility", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSocialPostDto.prototype, "allowComments", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('all', { each: true }),
    __metadata("design:type", Array)
], CreateSocialPostDto.prototype, "productIds", void 0);
class UpdateSocialPostDto {
    caption;
    hashtags;
    visibility;
    allowComments;
    isFeatured;
    isPinned;
}
exports.UpdateSocialPostDto = UpdateSocialPostDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSocialPostDto.prototype, "caption", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateSocialPostDto.prototype, "hashtags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: SocialPostVisibility }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SocialPostVisibility),
    __metadata("design:type", String)
], UpdateSocialPostDto.prototype, "visibility", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateSocialPostDto.prototype, "allowComments", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateSocialPostDto.prototype, "isFeatured", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateSocialPostDto.prototype, "isPinned", void 0);
class UpdatePostStatusDto {
    action;
}
exports.UpdatePostStatusDto = UpdatePostStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: [
            'PUBLISH',
            'UNPUBLISH',
            'HIDE',
            'UNHIDE',
            'ARCHIVE',
            'RESTORE',
            'FEATURE',
            'UNFEATURE',
        ],
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePostStatusDto.prototype, "action", void 0);
class SocialInteractionDto {
    action;
    channel;
    watchDuration;
    completionPercentage;
    guestId;
    sessionId;
}
exports.SocialInteractionDto = SocialInteractionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: SocialInteractionAction }),
    (0, class_validator_1.IsEnum)(SocialInteractionAction),
    __metadata("design:type", String)
], SocialInteractionDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SocialInteractionDto.prototype, "channel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SocialInteractionDto.prototype, "watchDuration", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], SocialInteractionDto.prototype, "completionPercentage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SocialInteractionDto.prototype, "guestId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SocialInteractionDto.prototype, "sessionId", void 0);
class CreateCommentDto {
    content;
    parentId;
}
exports.CreateCommentDto = CreateCommentDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCommentDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateCommentDto.prototype, "parentId", void 0);
class CreateReportDto {
    reason;
    description;
}
exports.CreateReportDto = CreateReportDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: SocialReportReason }),
    (0, class_validator_1.IsEnum)(SocialReportReason),
    __metadata("design:type", String)
], CreateReportDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReportDto.prototype, "description", void 0);
class ResolveReportDto {
    action;
    resolution;
}
exports.ResolveReportDto = ResolveReportDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['DISMISS', 'MARK_REVIEWED', 'TAKE_ACTION'] }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResolveReportDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResolveReportDto.prototype, "resolution", void 0);
class SocialFeedQueryDto {
    page;
    limit;
    search;
}
exports.SocialFeedQueryDto = SocialFeedQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], SocialFeedQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], SocialFeedQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SocialFeedQueryDto.prototype, "search", void 0);
class SocialReelsQueryDto {
    page;
    limit;
}
exports.SocialReelsQueryDto = SocialReelsQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], SocialReelsQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], SocialReelsQueryDto.prototype, "limit", void 0);
class AdminSocialQueryDto {
    contentType;
    status;
    page;
    limit;
}
exports.AdminSocialQueryDto = AdminSocialQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SocialPostContentType),
    __metadata("design:type", String)
], AdminSocialQueryDto.prototype, "contentType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SocialPostStatus),
    __metadata("design:type", String)
], AdminSocialQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], AdminSocialQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], AdminSocialQueryDto.prototype, "limit", void 0);
class AdminReportsQueryDto {
    status;
    reason;
    postId;
    page;
    limit;
}
exports.AdminReportsQueryDto = AdminReportsQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SocialReportStatus),
    __metadata("design:type", String)
], AdminReportsQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SocialReportReason),
    __metadata("design:type", String)
], AdminReportsQueryDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AdminReportsQueryDto.prototype, "postId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], AdminReportsQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], AdminReportsQueryDto.prototype, "limit", void 0);
//# sourceMappingURL=social.types.js.map