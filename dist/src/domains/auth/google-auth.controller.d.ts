import { GoogleAuthService } from './services/google-auth.service';
export declare class UpdateGoogleAuthConfigDto {
    clientId: string;
}
export declare class GoogleAuthAdminController {
    private readonly googleAuthService;
    constructor(googleAuthService: GoogleAuthService);
    getConfig(): Promise<import("@common/responses/response.builder").ResponsePayload<{
        clientId: string;
    }>>;
    updateConfig(dto: UpdateGoogleAuthConfigDto): Promise<import("@common/responses/response.builder").ResponsePayload<{
        clientId: string;
    }>>;
}
