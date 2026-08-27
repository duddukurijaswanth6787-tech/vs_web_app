import { RetrievalResult } from './rag-agent.types';
export declare class RagPromptBuilder {
    buildSystemPrompt(params: {
        agentName: string;
        systemPrompt: string;
        instructions?: string;
    }): string;
    buildUserPrompt(params: {
        userMessage: string;
        retrievedChunks: RetrievalResult[];
        toolResults: any[];
    }): string;
}
