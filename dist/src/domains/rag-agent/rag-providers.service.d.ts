import { ConfigService } from '@nestjs/config';
import { LlmProvider, EmbeddingProvider, LlmMessage, LlmChatOptions, LlmResponse } from './rag-agent.types';
export declare class GeminiLlmProvider implements LlmProvider {
    private readonly configService;
    private readonly apiKey;
    private readonly apiBase;
    private readonly logger;
    constructor(configService: ConfigService);
    getProviderName(): string;
    healthCheck(): Promise<boolean>;
    chat(messages: LlmMessage[], options: LlmChatOptions): Promise<LlmResponse>;
}
export declare class OpenAiLlmProvider implements LlmProvider {
    private readonly configService;
    private readonly apiKey;
    private readonly logger;
    constructor(configService: ConfigService);
    getProviderName(): string;
    healthCheck(): Promise<boolean>;
    chat(messages: LlmMessage[], options: LlmChatOptions): Promise<LlmResponse>;
}
export declare class GeminiEmbeddingProvider implements EmbeddingProvider {
    private readonly configService;
    private readonly apiKey;
    private readonly logger;
    readonly dimensions = 3072;
    constructor(configService: ConfigService);
    getProviderName(): string;
    healthCheck(): Promise<boolean>;
    embed(text: string, model?: string): Promise<number[]>;
    embedBatch(texts: string[], model?: string): Promise<number[][]>;
}
export declare class OpenAiEmbeddingProvider implements EmbeddingProvider {
    private readonly configService;
    private readonly apiKey;
    private readonly logger;
    readonly dimensions = 1536;
    constructor(configService: ConfigService);
    getProviderName(): string;
    healthCheck(): Promise<boolean>;
    embed(text: string, model?: string): Promise<number[]>;
    embedBatch(texts: string[], model?: string): Promise<number[][]>;
}
export declare class LlmProviderRegistry {
    private readonly providers;
    constructor(gemini: GeminiLlmProvider, openai: OpenAiLlmProvider);
    getProvider(name: string): LlmProvider;
}
export declare class EmbeddingProviderRegistry {
    private readonly providers;
    constructor(gemini: GeminiEmbeddingProvider, openai: OpenAiEmbeddingProvider);
    getProvider(name: string): EmbeddingProvider;
}
