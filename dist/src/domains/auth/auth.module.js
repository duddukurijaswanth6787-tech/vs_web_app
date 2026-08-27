"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const app_setting_repository_1 = require("../app-setting/app-setting.repository");
const auth_controller_1 = require("./auth.controller");
const session_settings_controller_1 = require("./session-settings.controller");
const google_auth_controller_1 = require("./google-auth.controller");
const auth_service_1 = require("./auth.service");
const auth_repository_1 = require("./auth.repository");
const password_service_1 = require("./services/password.service");
const jwt_service_1 = require("./services/jwt.service");
const refresh_token_service_1 = require("./services/refresh-token.service");
const session_settings_service_1 = require("./services/session-settings.service");
const firebase_admin_service_1 = require("./services/firebase-admin.service");
const google_auth_service_1 = require("./services/google-auth.service");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const roles_guard_1 = require("./guards/roles.guard");
const permissions_guard_1 = require("./guards/permissions.guard");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        controllers: [auth_controller_1.AuthController, session_settings_controller_1.SessionSettingsController, google_auth_controller_1.GoogleAuthAdminController],
        providers: [
            auth_service_1.AuthService,
            auth_repository_1.AuthRepository,
            password_service_1.PasswordService,
            jwt_service_1.JwtService,
            refresh_token_service_1.RefreshTokenService,
            session_settings_service_1.SessionSettingsService,
            app_setting_repository_1.AppSettingRepository,
            firebase_admin_service_1.FirebaseAdminService,
            google_auth_service_1.GoogleAuthService,
            jwt_auth_guard_1.JwtAuthGuard,
            roles_guard_1.RolesGuard,
            permissions_guard_1.PermissionsGuard,
        ],
        exports: [
            auth_service_1.AuthService,
            auth_repository_1.AuthRepository,
            jwt_auth_guard_1.JwtAuthGuard,
            jwt_service_1.JwtService,
            roles_guard_1.RolesGuard,
            permissions_guard_1.PermissionsGuard,
            password_service_1.PasswordService,
            refresh_token_service_1.RefreshTokenService,
            session_settings_service_1.SessionSettingsService,
            firebase_admin_service_1.FirebaseAdminService,
            google_auth_service_1.GoogleAuthService,
        ],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map