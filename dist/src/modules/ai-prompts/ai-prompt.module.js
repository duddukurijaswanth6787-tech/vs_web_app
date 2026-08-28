"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiPromptModule = void 0;
const common_1 = require("@nestjs/common");
const audit_module_1 = require("../../domains/audit/audit.module");
const ai_prompt_controller_1 = require("./ai-prompt.controller");
const ai_prompt_service_1 = require("./ai-prompt.service");
let AiPromptModule = class AiPromptModule {
};
exports.AiPromptModule = AiPromptModule;
exports.AiPromptModule = AiPromptModule = __decorate([
    (0, common_1.Module)({
        imports: [audit_module_1.AuditModule],
        controllers: [ai_prompt_controller_1.AiPromptController],
        providers: [ai_prompt_service_1.AiPromptService],
    })
], AiPromptModule);
//# sourceMappingURL=ai-prompt.module.js.map