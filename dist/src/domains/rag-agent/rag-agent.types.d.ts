export declare class CreateAgentDto {
    name: string;
    agentKey: string;
    description: string;
    avatarUrl?: string;
    modelProvider?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt: string;
    instructions?: string;
    behaviorConfig?: any;
    toolConfig?: any;
    guardrailConfig?: any;
    isDefault?: boolean;
}
export declare class UpdateAgentDto {
    name?: string;
    description?: string;
    modelProvider?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    instructions?: string;
    behaviorConfig?: any;
    toolConfig?: any;
    guardrailConfig?: any;
}
export declare class AgentStatusDto {
    action: 'ACTIVATE' | 'DEACTIVATE';
}
export declare class AssignKnowledgeDto {
    knowledgeSourceIds: string[];
    replace?: boolean;
}
export declare class ConfigureToolsDto {
    tools: string[];
}
export declare class TestAgentDto {
    message: string;
    context?: any;
}
export declare class ChatRequestDto {
    agentKey: string;
    conversationId?: string;
    message: string;
}
export declare class SubmitFeedbackDto {
    isHelpful?: boolean;
    rating?: number;
    comment?: string;
}
export interface LlmChatOptions {
    model: string;
    temperature: number;
    maxTokens: number;
    systemPrompt?: string;
}
export interface LlmMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
export interface LlmResponse {
    content: string;
    promptTokens: number;
    completionTokens: number;
}
export interface LlmProvider {
    chat(messages: LlmMessage[], options: LlmChatOptions): Promise<LlmResponse>;
    healthCheck(): Promise<boolean>;
    getProviderName(): string;
}
export interface EmbeddingProvider {
    embed(text: string, model: string): Promise<number[]>;
    embedBatch(texts: string[], model: string): Promise<number[][]>;
    dimensions: number;
    healthCheck(): Promise<boolean>;
    getProviderName(): string;
}
export interface RetrievalResult {
    chunkId: string;
    documentId: string;
    knowledgeSourceId: string;
    content: string;
    vectorScore: number;
    keywordScore: number;
    finalScore: number;
    metadata: any;
}
