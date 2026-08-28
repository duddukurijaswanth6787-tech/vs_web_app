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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmitFeedbackDto = exports.ChatRequestDto = exports.TestAgentDto = exports.ConfigureToolsDto = exports.AssignKnowledgeDto = exports.AgentStatusDto = exports.UpdateAgentDto = exports.CreateAgentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateAgentDto {
    name;
    agentKey;
    description;
    avatarUrl;
    modelProvider;
    model;
    temperature;
    maxTokens;
    systemPrompt;
    instructions;
    behaviorConfig;
    toolConfig;
    guardrailConfig;
    isDefault;
}
exports.CreateAgentDto = CreateAgentDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "agentKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "avatarUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 'gemini' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "modelProvider", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 'gemini-1.5-flash' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "model", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 0.7 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(2),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateAgentDto.prototype, "temperature", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1000 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateAgentDto.prototype, "maxTokens", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "systemPrompt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "instructions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateAgentDto.prototype, "behaviorConfig", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateAgentDto.prototype, "toolConfig", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateAgentDto.prototype, "guardrailConfig", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateAgentDto.prototype, "isDefault", void 0);
class UpdateAgentDto {
    name;
    description;
    modelProvider;
    model;
    temperature;
    maxTokens;
    systemPrompt;
    instructions;
    behaviorConfig;
    toolConfig;
    guardrailConfig;
}
exports.UpdateAgentDto = UpdateAgentDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAgentDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAgentDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAgentDto.prototype, "modelProvider", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAgentDto.prototype, "model", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(2),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateAgentDto.prototype, "temperature", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateAgentDto.prototype, "maxTokens", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAgentDto.prototype, "systemPrompt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAgentDto.prototype, "instructions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateAgentDto.prototype, "behaviorConfig", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateAgentDto.prototype, "toolConfig", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateAgentDto.prototype, "guardrailConfig", void 0);
class AgentStatusDto {
    action;
}
exports.AgentStatusDto = AgentStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsIn)(['ACTIVATE', 'DEACTIVATE']),
    __metadata("design:type", String)
], AgentStatusDto.prototype, "action", void 0);
class AssignKnowledgeDto {
    knowledgeSourceIds;
    replace;
}
exports.AssignKnowledgeDto = AssignKnowledgeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AssignKnowledgeDto.prototype, "knowledgeSourceIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AssignKnowledgeDto.prototype, "replace", void 0);
class ConfigureToolsDto {
    tools;
}
exports.ConfigureToolsDto = ConfigureToolsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ConfigureToolsDto.prototype, "tools", void 0);
class TestAgentDto {
    message;
    context;
}
exports.TestAgentDto = TestAgentDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TestAgentDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], TestAgentDto.prototype, "context", void 0);
class ChatRequestDto {
    agentKey;
    conversationId;
    message;
}
exports.ChatRequestDto = ChatRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChatRequestDto.prototype, "agentKey", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ChatRequestDto.prototype, "conversationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChatRequestDto.prototype, "message", void 0);
class SubmitFeedbackDto {
    isHelpful;
    rating;
    comment;
}
exports.SubmitFeedbackDto = SubmitFeedbackDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SubmitFeedbackDto.prototype, "isHelpful", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], SubmitFeedbackDto.prototype, "rating", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitFeedbackDto.prototype, "comment", void 0);
//# sourceMappingURL=rag-agent.types.js.map