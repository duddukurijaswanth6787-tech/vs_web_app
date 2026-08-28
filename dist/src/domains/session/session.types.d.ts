export declare class SessionQueryDto {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    startDate?: string;
    endDate?: string;
}
export declare class SessionResponse {
    id: string;
    userId: string;
    ipAddress?: string;
    userAgent?: string;
    isRevoked: boolean;
    revokedAt?: Date;
    createdAt: Date;
    lastActivityAt: Date;
    expiresAt: Date;
    isExpired: boolean;
    get rememberMe(): boolean;
}
