"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var FirebaseAdminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseAdminService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const exceptions_1 = require("../../../common/exceptions");
let FirebaseAdminService = FirebaseAdminService_1 = class FirebaseAdminService {
    configService;
    logger = new common_1.Logger(FirebaseAdminService_1.name);
    app = null;
    constructor(configService) {
        this.configService = configService;
    }
    async getApp() {
        if (this.app)
            return this.app;
        const { initializeApp, getApps, cert } = await Promise.resolve().then(() => __importStar(require('firebase-admin/app')));
        const existing = getApps();
        if (existing.length) {
            this.app = existing[0];
            return this.app;
        }
        const projectId = this.configService.get('app.firebase.projectId');
        const clientEmail = this.configService.get('app.firebase.clientEmail');
        const privateKey = this.configService.get('app.firebase.privateKey');
        if (!projectId || !clientEmail || !privateKey) {
            throw new exceptions_1.BusinessException('Firebase phone login is not configured on the server. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.', 'FIREBASE_000');
        }
        this.app = initializeApp({
            credential: cert({
                projectId,
                clientEmail,
                privateKey: privateKey.replace(/\\n/g, '\n'),
            }),
        });
        return this.app;
    }
    async verifyPhoneIdToken(idToken) {
        let decoded;
        try {
            const { getAuth } = await Promise.resolve().then(() => __importStar(require('firebase-admin/auth')));
            decoded = await getAuth(await this.getApp()).verifyIdToken(idToken);
        }
        catch (err) {
            if (err instanceof exceptions_1.BusinessException)
                throw err;
            this.logger.warn(`Firebase ID token verification failed: ${err.message}`);
            throw new exceptions_1.AuthenticationException('Invalid or expired Firebase ID token', 'FIREBASE_001');
        }
        const phoneNumber = decoded.phone_number;
        if (!phoneNumber) {
            throw new exceptions_1.AuthenticationException('This Firebase token has no verified phone number on it', 'FIREBASE_002');
        }
        return { uid: decoded.uid, phone: phoneNumber };
    }
};
exports.FirebaseAdminService = FirebaseAdminService;
exports.FirebaseAdminService = FirebaseAdminService = FirebaseAdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FirebaseAdminService);
//# sourceMappingURL=firebase-admin.service.js.map