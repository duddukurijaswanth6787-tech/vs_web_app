export declare class CreateCampaignDto {
    name: string;
    description?: string;
    type: string;
    channel: string;
    subject?: string;
    content?: string;
    audience?: string[];
    scheduledAt?: Date;
}
export declare class UpdateCampaignDto {
    name?: string;
    description?: string;
    type?: string;
    channel?: string;
    subject?: string;
    content?: string;
    audience?: string[];
    scheduledAt?: Date;
}
export declare class CampaignResponse {
    id: string;
    name: string;
    description?: string;
    type: string;
    channel: string;
    subject?: string;
    content?: string;
    status: string;
    sentCount: number;
    openCount: number;
    clickCount: number;
    scheduledAt?: Date;
    sentAt?: Date;
    createdAt: Date;
}
export declare class CampaignQueryDto {
    type?: string;
    channel?: string;
    status?: string;
    page?: number;
    limit?: number;
}
