export interface CreateCampaignDto {
  name: string;
  description?: string;
  type: string;
  channel: string;
  subject?: string;
  content?: string;
  audience?: string[];
  scheduledAt?: string;
}

export interface UpdateCampaignDto {
  name?: string;
  description?: string;
  type?: string;
  channel?: string;
  subject?: string;
  content?: string;
  audience?: string[];
  scheduledAt?: string;
}

/** Audience may be a segment id list or a structured config object from JSON storage. */
export interface AudienceConfig {
  segments?: string[];
  tags?: string[];
  [key: string]: unknown;
}

export type CampaignAudience = string[] | AudienceConfig;

export interface CampaignResponse {
  id: string;
  name: string;
  description?: string;
  type: string;
  channel: string;
  subject?: string;
  content?: string;
  status: string;
  audience?: CampaignAudience;
  sentCount: number;
  openCount: number;
  clickCount: number;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
}

export interface CampaignQueryDto {
  type?: string;
  channel?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface CampaignListResponse {
  data: CampaignResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
