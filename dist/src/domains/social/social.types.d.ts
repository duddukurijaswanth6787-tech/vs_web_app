export declare enum SocialPostContentType {
    POST = "POST",
    REEL = "REEL"
}
export declare enum SocialPostStatus {
    DRAFT = "DRAFT",
    PUBLISHED = "PUBLISHED",
    HIDDEN = "HIDDEN",
    ARCHIVED = "ARCHIVED"
}
export declare enum SocialPostVisibility {
    PUBLIC = "PUBLIC",
    HIDDEN = "HIDDEN"
}
export declare enum SocialMediaType {
    IMAGE = "IMAGE",
    VIDEO = "VIDEO"
}
export declare enum SocialReportReason {
    SPAM = "SPAM",
    INAPPROPRIATE = "INAPPROPRIATE",
    MISLEADING = "MISLEADING",
    COPYRIGHT = "COPYRIGHT",
    OTHER = "OTHER"
}
export declare enum SocialReportStatus {
    PENDING = "PENDING",
    REVIEWED = "REVIEWED",
    DISMISSED = "DISMISSED",
    ACTION_TAKEN = "ACTION_TAKEN"
}
export declare enum SocialInteractionAction {
    LIKE = "LIKE",
    UNLIKE = "UNLIKE",
    SAVE = "SAVE",
    UNSAVE = "UNSAVE",
    SHARE = "SHARE",
    VIEW = "VIEW",
    PLAY = "PLAY",
    COMPLETE = "COMPLETE"
}
export declare class ProductTagDto {
    productId: string;
    variantId?: string;
    displayOrder?: number;
    tagX?: number;
    tagY?: number;
    label?: string;
}
export declare class PostMediaDto {
    mediaType: SocialMediaType;
    s3Key: string;
    url: string;
    thumbnailUrl?: string;
    mediumUrl?: string;
    largeUrl?: string;
    mimeType: string;
    size: number;
    width?: number;
    height?: number;
    duration?: number;
    displayOrder?: number;
    altText?: string;
}
export declare class CreateSocialPostDto {
    contentType: SocialPostContentType;
    caption?: string;
    hashtags?: string[];
    visibility?: SocialPostVisibility;
    allowComments?: boolean;
    productIds?: string[];
}
export declare class UpdateSocialPostDto {
    caption?: string;
    hashtags?: string[];
    visibility?: SocialPostVisibility;
    allowComments?: boolean;
    isFeatured?: boolean;
    isPinned?: boolean;
}
export declare class UpdatePostStatusDto {
    action: 'PUBLISH' | 'UNPUBLISH' | 'HIDE' | 'UNHIDE' | 'ARCHIVE' | 'RESTORE' | 'FEATURE' | 'UNFEATURE';
}
export declare class SocialInteractionDto {
    action: SocialInteractionAction;
    channel?: string;
    watchDuration?: number;
    completionPercentage?: number;
    guestId?: string;
    sessionId?: string;
}
export declare class CreateCommentDto {
    content: string;
    parentId?: string;
}
export declare class CreateReportDto {
    reason: SocialReportReason;
    description?: string;
}
export declare class ResolveReportDto {
    action: 'DISMISS' | 'MARK_REVIEWED' | 'TAKE_ACTION';
    resolution?: string;
}
export declare class SocialFeedQueryDto {
    page?: number;
    limit?: number;
    search?: string;
}
export declare class SocialReelsQueryDto {
    page?: number;
    limit?: number;
}
export declare class AdminSocialQueryDto {
    contentType?: SocialPostContentType;
    status?: SocialPostStatus;
    page?: number;
    limit?: number;
}
export declare class AdminReportsQueryDto {
    status?: SocialReportStatus;
    reason?: SocialReportReason;
    postId?: string;
    page?: number;
    limit?: number;
}
