import { ConfigService } from '@nestjs/config';
export declare class StartupVersionService {
    private readonly configService;
    constructor(configService: ConfigService);
    getAppVersion(): string;
    getNodeVersion(): string;
    getNestVersion(): string;
    getEnv(): string;
    getPort(): number;
    getHostname(): string;
    getApiPrefix(): string;
}
