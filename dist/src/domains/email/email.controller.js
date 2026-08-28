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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const email_service_1 = require("./email.service");
const email_types_1 = require("./email.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let EmailController = class EmailController {
    emailService;
    constructor(emailService) {
        this.emailService = emailService;
    }
    async send(user, dto) {
        return response_builder_1.ResponseBuilder.success(await this.emailService.send(dto, user.sub), 'Email queued');
    }
    async logs(page, limit) {
        return response_builder_1.ResponseBuilder.success(await this.emailService.listLogs(Number(page) || 1, Number(limit) || 20));
    }
};
exports.EmailController = EmailController;
__decorate([
    (0, common_1.Post)('send'),
    (0, swagger_1.ApiOperation)({ summary: 'Send a custom email' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, email_types_1.SendEmailDto]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "send", null);
__decorate([
    (0, common_1.Get)('logs'),
    (0, swagger_1.ApiOperation)({ summary: 'List email send logs' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "logs", null);
exports.EmailController = EmailController = __decorate([
    (0, swagger_1.ApiTags)('Email'),
    (0, common_1.Controller)('email'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin', 'staff'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [email_service_1.EmailService])
], EmailController);
//# sourceMappingURL=email.controller.js.map