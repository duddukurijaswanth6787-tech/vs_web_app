"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GoogleAuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const google_auth_library_1 = require("google-auth-library");
const exceptions_1 = require("../../../common/exceptions");
const app_setting_repository_1 = require("../../app-setting/app-setting.repository");
const GROUP = 'google_auth';
const CLIENT_ID_KEY = 'google_auth.client_id';
let GoogleAuthService = GoogleAuthService_1 = class GoogleAuthService {
    configService;
    settingRepository;
    logger = new common_1.Logger(GoogleAuthService_1.name);
    constructor(configService, settingRepository) {
        this.configService = configService;
        this.settingRepository = settingRepository;
    }
    async getEffectiveClientId() {
        const dbValue = await this.settingRepository.getByKey(CLIENT_ID_KEY);
        return dbValue || this.configService.get('app.google.clientId', '');
    }
    async updateClientId(clientId) {
        const existing = await this.settingRepository.findByKey(CLIENT_ID_KEY);
        if (existing) {
            await this.settingRepository.update(existing.id, { value: clientId });
        }
        else {
            await this.settingRepository.create({
                key: CLIENT_ID_KEY,
                value: clientId,
                group: GROUP,
                description: 'Google OAuth Web Client ID (Google Cloud Console > Google Auth Platform > Clients)',
            });
        }
        return { clientId: await this.getEffectiveClientId() };
    }
    async verifyIdToken(credential) {
        const clientId = await this.getEffectiveClientId();
        if (!clientId) {
            throw new exceptions_1.BusinessException('Google login is not configured on the server. Set a Client ID via Admin > Access > Login Sessions, or the GOOGLE_CLIENT_ID env var.', 'GOOGLE_000');
        }
        const client = new google_auth_library_1.OAuth2Client(clientId);
        let payload;
        try {
            const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
            payload = ticket.getPayload();
        }
        catch (err) {
            this.logger.warn(`Google ID token verification failed: ${err.message}`);
            throw new exceptions_1.AuthenticationException('Invalid or expired Google credential', 'GOOGLE_001');
        }
        if (!payload?.sub || !payload.email) {
            throw new exceptions_1.AuthenticationException('This Google credential has no verified account on it', 'GOOGLE_002');
        }
        return {
            googleId: payload.sub,
            email: payload.email,
            emailVerified: payload.email_verified ?? false,
            firstName: payload.given_name || payload.name || 'Customer',
            lastName: payload.family_name || undefined,
            avatar: payload.picture || undefined,
        };
    }
};
exports.GoogleAuthService = GoogleAuthService;
exports.GoogleAuthService = GoogleAuthService = GoogleAuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        app_setting_repository_1.AppSettingRepository])
], GoogleAuthService);
//# sourceMappingURL=google-auth.service.js.map