export declare class RegisterDeviceDto {
    token: string;
    platform?: string;
    deviceName?: string;
}
export declare class SendPushDto {
    userId?: string;
    title: string;
    body: string;
    data?: Record<string, any>;
}
