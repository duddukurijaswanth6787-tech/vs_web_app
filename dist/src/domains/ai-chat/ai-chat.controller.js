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
exports.AiChatController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const ai_chat_service_1 = require("./ai-chat.service");
const ai_chat_types_1 = require("./ai-chat.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let AiChatController = class AiChatController {
    aiChatService;
    constructor(aiChatService) {
        this.aiChatService = aiChatService;
    }
    async findAll(query, user) {
        return response_builder_1.ResponseBuilder.success(await this.aiChatService.findAll(user.sub, query));
    }
    async findById(id, user) {
        return response_builder_1.ResponseBuilder.success(await this.aiChatService.findById(id, user.sub));
    }
    async create(dto, user) {
        return response_builder_1.ResponseBuilder.created(await this.aiChatService.create(user.sub, dto), 'Conversation created');
    }
    async sendMessage(id, dto, user) {
        return response_builder_1.ResponseBuilder.created(await this.aiChatService.sendMessage(id, user.sub, dto), 'Message sent');
    }
    async getMessages(id, page, limit, user) {
        return response_builder_1.ResponseBuilder.success(await this.aiChatService.getMessages(id, user.sub, page, limit));
    }
    async addFeedback(id, dto, user) {
        await this.aiChatService.addFeedback(user.sub, { ...dto, referenceId: id });
        return response_builder_1.ResponseBuilder.created(null, 'Feedback submitted');
    }
};
exports.AiChatController = AiChatController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'List own conversations' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_chat_types_1.ConversationQueryDto, Object]),
    __metadata("design:returntype", Promise)
], AiChatController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get conversation by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AiChatController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create conversation' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_chat_types_1.CreateConversationDto, Object]),
    __metadata("design:returntype", Promise)
], AiChatController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/messages'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Send message' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ai_chat_types_1.SendMessageDto, Object]),
    __metadata("design:returntype", Promise)
], AiChatController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Get)(':id/messages'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get messages' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], AiChatController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)(':id/feedback'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Add feedback' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ai_chat_types_1.AddFeedbackDto, Object]),
    __metadata("design:returntype", Promise)
], AiChatController.prototype, "addFeedback", null);
exports.AiChatController = AiChatController = __decorate([
    (0, swagger_1.ApiTags)('AI Chat'),
    (0, common_1.Controller)('ai/chat'),
    __metadata("design:paramtypes", [ai_chat_service_1.AiChatService])
], AiChatController);
//# sourceMappingURL=ai-chat.controller.js.map