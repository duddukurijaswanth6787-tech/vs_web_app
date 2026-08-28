"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RagAgentModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../../database/database.module");
const config_1 = require("@nestjs/config");
const auth_module_1 = require("../auth/auth.module");
const search_module_1 = require("../search/search.module");
const products_module_1 = require("../products/products.module");
const audit_module_1 = require("../audit/audit.module");
const rag_agent_repository_1 = require("./rag-agent.repository");
const rag_agent_service_1 = require("./rag-agent.service");
const rag_orchestrator_service_1 = require("./rag-orchestrator.service");
const rag_retrieval_service_1 = require("./rag-retrieval.service");
const rag_intent_service_1 = require("./rag-intent.service");
const rag_prompt_builder_1 = require("./rag-prompt.builder");
const rag_tool_registry_1 = require("./rag-tool.registry");
const rag_providers_service_1 = require("./rag-providers.service");
const rag_agent_controller_1 = require("./rag-agent.controller");
const rag_admin_agent_controller_1 = require("./rag-admin-agent.controller");
const rag_analytics_controller_1 = require("./rag-analytics.controller");
let RagAgentModule = class RagAgentModule {
};
exports.RagAgentModule = RagAgentModule;
exports.RagAgentModule = RagAgentModule = __decorate([
    (0, common_1.Module)({
        imports: [
            database_module_1.DatabaseModule,
            config_1.ConfigModule,
            (0, common_1.forwardRef)(() => auth_module_1.AuthModule),
            (0, common_1.forwardRef)(() => search_module_1.SearchModule),
            (0, common_1.forwardRef)(() => products_module_1.ProductsModule),
            audit_module_1.AuditModule,
        ],
        controllers: [
            rag_agent_controller_1.RagAgentController,
            rag_admin_agent_controller_1.RagAdminAgentController,
            rag_analytics_controller_1.RagAnalyticsController,
        ],
        providers: [
            rag_agent_repository_1.RagAgentRepository,
            rag_agent_service_1.RagAgentService,
            rag_orchestrator_service_1.RagOrchestratorService,
            rag_retrieval_service_1.RagRetrievalService,
            rag_intent_service_1.RagIntentService,
            rag_prompt_builder_1.RagPromptBuilder,
            rag_tool_registry_1.RagToolRegistry,
            rag_providers_service_1.GeminiLlmProvider,
            rag_providers_service_1.OpenAiLlmProvider,
            rag_providers_service_1.GeminiEmbeddingProvider,
            rag_providers_service_1.OpenAiEmbeddingProvider,
            rag_providers_service_1.LlmProviderRegistry,
            rag_providers_service_1.EmbeddingProviderRegistry,
        ],
        exports: [
            rag_agent_service_1.RagAgentService,
            rag_orchestrator_service_1.RagOrchestratorService,
            rag_retrieval_service_1.RagRetrievalService,
            rag_providers_service_1.LlmProviderRegistry,
            rag_providers_service_1.EmbeddingProviderRegistry,
        ],
    })
], RagAgentModule);
//# sourceMappingURL=rag-agent.module.js.map