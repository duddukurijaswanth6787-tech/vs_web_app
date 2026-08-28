import { ConfigService } from '@nestjs/config';
export declare class FirebaseAdminService {
    private readonly configService;
    private readonly logger;
    private app;
    constructor(configService: ConfigService);
    private getApp;
    verifyPhoneIdToken(idToken: string): Promise<{
        uid: string;
        phone: string;
    }>;
}
