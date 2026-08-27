import { SessionSettingsService } from './services/session-settings.service';
import { UpdateSessionExpirySettingsDto } from './services/session-settings.types';
import type { JwtPayload } from './services/jwt.service';
export declare class SessionSettingsController {
    private readonly sessionSettingsService;
    constructor(sessionSettingsService: SessionSettingsService);
    getSettings(): Promise<import("@common/responses/response.builder").ResponsePayload<import("./services/session-settings.types").SessionExpirySettingsResponse>>;
    updateSettings(dto: UpdateSessionExpirySettingsDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./services/session-settings.types").SessionExpirySettingsResponse>>;
}
