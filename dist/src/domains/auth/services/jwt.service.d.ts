import { ConfigService } from '@nestjs/config';
import { SessionSettingsService } from './session-settings.service';
export interface JwtPayload {
    sub: string;
    email: string;
    userType: string;
    roles: string[];
}
export declare class JwtService {
    private readonly configService;
    private readonly sessionSettingsService;
    private readonly secret;
    private readonly issuer;
    constructor(configService: ConfigService, sessionSettingsService: SessionSettingsService);
    sign(payload: JwtPayload, rememberMe?: boolean): Promise<string>;
    verify(token: string): JwtPayload;
    getExpiresIn(rememberMe?: boolean): Promise<number>;
}
