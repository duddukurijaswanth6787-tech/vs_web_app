-- CreateTable
CREATE TABLE "rag_agents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "agentKey" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "modelProvider" TEXT NOT NULL DEFAULT 'gemini',
    "model" TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
    "temperature" DECIMAL(65,30) NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 1000,
    "systemPrompt" TEXT NOT NULL,
    "instructions" TEXT,
    "behaviorConfig" JSONB NOT NULL DEFAULT '{}',
    "toolConfig" JSONB NOT NULL DEFAULT '{}',
    "guardrailConfig" JSONB NOT NULL DEFAULT '{}',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rag_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rag_knowledge_sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sourceUrl" TEXT,
    "s3Key" TEXT,
    "mimeType" TEXT,
    "originalFileName" TEXT,
    "rawText" TEXT,
    "checksum" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "lastIndexedAt" TIMESTAMP(3),
    "indexingError" TEXT,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rag_knowledge_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rag_agent_knowledge_sources" (
    "agentId" TEXT NOT NULL,
    "knowledgeSourceId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rag_agent_knowledge_sources_pkey" PRIMARY KEY ("agentId","knowledgeSourceId")
);

-- CreateTable
CREATE TABLE "rag_documents" (
    "id" TEXT NOT NULL,
    "knowledgeSourceId" TEXT NOT NULL,
    "title" TEXT,
    "contentHash" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rag_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rag_document_chunks" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "knowledgeSourceId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "tokenCount" INTEGER NOT NULL,
    "embedding" DOUBLE PRECISION[],
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rag_document_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rag_conversations" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "customerId" TEXT,
    "guestId" TEXT,
    "title" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rag_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rag_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "intent" TEXT,
    "modelProvider" TEXT,
    "model" TEXT,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "totalTokens" INTEGER,
    "responseTimeMs" INTEGER,
    "confidence" DECIMAL(65,30),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rag_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rag_message_citations" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "knowledgeSourceId" TEXT NOT NULL,
    "documentId" TEXT,
    "chunkId" TEXT,
    "citationIndex" INTEGER NOT NULL,
    "label" TEXT,
    "excerpt" TEXT,
    "relevanceScore" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rag_message_citations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rag_tool_executions" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "messageId" TEXT,
    "toolName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "durationMs" INTEGER,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rag_tool_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rag_agent_metrics" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "conversations" INTEGER NOT NULL DEFAULT 0,
    "messages" INTEGER NOT NULL DEFAULT 0,
    "successfulResponses" INTEGER NOT NULL DEFAULT 0,
    "failedResponses" INTEGER NOT NULL DEFAULT 0,
    "averageResponseTimeMs" INTEGER NOT NULL DEFAULT 0,
    "averageConfidence" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
    "totalPromptTokens" INTEGER NOT NULL DEFAULT 0,
    "totalCompletionTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rag_agent_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rag_feedback" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT,
    "rating" INTEGER,
    "isHelpful" BOOLEAN,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rag_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rag_agents_agentKey_key" ON "rag_agents"("agentKey");

-- CreateIndex
CREATE INDEX "rag_agents_status_idx" ON "rag_agents"("status");

-- CreateIndex
CREATE INDEX "rag_knowledge_sources_status_idx" ON "rag_knowledge_sources"("status");

-- CreateIndex
CREATE INDEX "rag_knowledge_sources_sourceType_idx" ON "rag_knowledge_sources"("sourceType");

-- CreateIndex
CREATE INDEX "rag_documents_knowledgeSourceId_idx" ON "rag_documents"("knowledgeSourceId");

-- CreateIndex
CREATE INDEX "rag_document_chunks_documentId_idx" ON "rag_document_chunks"("documentId");

-- CreateIndex
CREATE INDEX "rag_document_chunks_knowledgeSourceId_idx" ON "rag_document_chunks"("knowledgeSourceId");

-- CreateIndex
CREATE INDEX "rag_conversations_customerId_idx" ON "rag_conversations"("customerId");

-- CreateIndex
CREATE INDEX "rag_conversations_guestId_idx" ON "rag_conversations"("guestId");

-- CreateIndex
CREATE INDEX "rag_conversations_agentId_idx" ON "rag_conversations"("agentId");

-- CreateIndex
CREATE INDEX "rag_conversations_lastMessageAt_idx" ON "rag_conversations"("lastMessageAt");

-- CreateIndex
CREATE INDEX "rag_messages_conversationId_createdAt_idx" ON "rag_messages"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "rag_tool_executions_conversationId_idx" ON "rag_tool_executions"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "rag_agent_metrics_agentId_date_key" ON "rag_agent_metrics"("agentId", "date");

-- AddForeignKey
ALTER TABLE "rag_agent_knowledge_sources" ADD CONSTRAINT "rag_agent_knowledge_sources_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "rag_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rag_agent_knowledge_sources" ADD CONSTRAINT "rag_agent_knowledge_sources_knowledgeSourceId_fkey" FOREIGN KEY ("knowledgeSourceId") REFERENCES "rag_knowledge_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rag_documents" ADD CONSTRAINT "rag_documents_knowledgeSourceId_fkey" FOREIGN KEY ("knowledgeSourceId") REFERENCES "rag_knowledge_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rag_document_chunks" ADD CONSTRAINT "rag_document_chunks_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "rag_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rag_conversations" ADD CONSTRAINT "rag_conversations_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "rag_agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rag_conversations" ADD CONSTRAINT "rag_conversations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rag_messages" ADD CONSTRAINT "rag_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "rag_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rag_message_citations" ADD CONSTRAINT "rag_message_citations_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "rag_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rag_tool_executions" ADD CONSTRAINT "rag_tool_executions_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "rag_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rag_agent_metrics" ADD CONSTRAINT "rag_agent_metrics_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "rag_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
