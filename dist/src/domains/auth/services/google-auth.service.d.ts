import { ConfigService } from '@nestjs/config';
import { AppSettingRepository } from "../../app-setting/app-setting.repository";
export interface GoogleProfile {
    googleId: string;
    email: string;
    emailVerified: boolean;
    firstName: string;
    lastName?: string;
    avatar?: string;
}
export declare class GoogleAuthService {
    private readonly configService;
    private readonly settingRepository;
    private readonly logger;
    constructor(configService: ConfigService, settingRepository: AppSettingRepository);
    getEffectiveClientId(): Promise<string>;
    updateClientId(clientId: string): Promise<{
        clientId: string;
    }>;
    verifyIdToken(credential: string): Promise<GoogleProfile>;
}
