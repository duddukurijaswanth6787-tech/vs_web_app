"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RagKnowledgeModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../../database/database.module");
const config_1 = require("@nestjs/config");
const storage_module_1 = require("../../infrastructure/storage/storage.module");
const audit_module_1 = require("../audit/audit.module");
const rag_agent_module_1 = require("../rag-agent/rag-agent.module");
const bullmq_1 = require("@nestjs/bullmq");
const rag_knowledge_repository_1 = require("./rag-knowledge.repository");
const rag_knowledge_service_1 = require("./rag-knowledge.service");
const rag_ingestion_service_1 = require("./rag-ingestion.service");
const rag_ingestion_worker_1 = require("./rag-ingestion.worker");
const rag_knowledge_controller_1 = require("./rag-knowledge.controller");
const isBullMQEnabled = process.env.ENABLE_BULLMQ !== 'false';
const imports = [
    database_module_1.DatabaseModule,
    config_1.ConfigModule,
    storage_module_1.StorageModule,
    audit_module_1.AuditModule,
    rag_agent_module_1.RagAgentModule,
];
const providers = [
    rag_knowledge_repository_1.RagKnowledgeRepository,
    rag_knowledge_service_1.RagKnowledgeService,
    rag_ingestion_service_1.RagIngestionService,
];
if (isBullMQEnabled) {
    imports.push(bullmq_1.BullModule.registerQueue({
        name: 'rag-ingestion',
    }));
    providers.push(rag_ingestion_worker_1.RagIngestionWorker);
}
else {
    providers.push({
        provide: 'BullQueue_rag-ingestion',
        useValue: {
            add: async () => { },
        },
    });
}
let RagKnowledgeModule = class RagKnowledgeModule {
};
exports.RagKnowledgeModule = RagKnowledgeModule;
exports.RagKnowledgeModule = RagKnowledgeModule = __decorate([
    (0, common_1.Module)({
        imports,
        controllers: [rag_knowledge_controller_1.RagKnowledgeController],
        providers,
        exports: [rag_knowledge_service_1.RagKnowledgeService, rag_ingestion_service_1.RagIngestionService],
    })
], RagKnowledgeModule);
//# sourceMappingURL=rag-knowledge.module.js.map