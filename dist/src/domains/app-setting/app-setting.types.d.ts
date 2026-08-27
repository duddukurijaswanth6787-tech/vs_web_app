export declare class CreateSettingDto {
    key: string;
    value: string;
    type?: string;
    group?: string;
    description?: string;
}
export declare class UpdateSettingDto {
    value: string;
    description?: string;
}
export declare class SettingResponse {
    id: string;
    key: string;
    value: string;
    type: string;
    group?: string;
    description?: string;
    createdAt: Date;
}
export declare class SettingQueryDto {
    group?: string;
    page?: number;
    limit?: number;
}
