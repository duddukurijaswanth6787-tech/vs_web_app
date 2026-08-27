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
exports.EmbeddingProviderRegistry = exports.LlmProviderRegistry = exports.OpenAiEmbeddingProvider = exports.GeminiEmbeddingProvider = exports.OpenAiLlmProvider = exports.GeminiLlmProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const exceptions_1 = require("../../common/exceptions");
let GeminiLlmProvider = class GeminiLlmProvider {
    configService;
    apiKey;
    apiBase;
    logger = new common_1.Logger('GeminiLlmProvider');
    constructor(configService) {
        this.configService = configService;
        const configKey = this.configService.get('app.gemini.apiKey');
        this.apiKey =
            configKey !== undefined ? configKey : process.env.GEMINI_API_KEY || '';
        this.apiBase = 'https://generativelanguage.googleapis.com/v1beta';
    }
    getProviderName() {
        return 'gemini';
    }
    async healthCheck() {
        return (!!this.apiKey &&
            this.apiKey !== 'mock_key' &&
            this.apiKey !== 'mock_secret');
    }
    async chat(messages, options) {
        if (!this.apiKey ||
            this.apiKey === 'mock_key' ||
            this.apiKey === 'mock_secret') {
            throw new exceptions_1.BusinessException('RAG LLM provider "gemini" is unconfigured. Please configure GEMINI_API_KEY.', 'RAG_PROVIDER_UNCONFIGURED');
        }
        let model = options.model ||
            this.configService.get('app.gemini.llmModel') ||
            process.env.GEMINI_LLM_MODEL ||
            'gemini-2.5-flash';
        if (model === 'gemini-1.5-flash') {
            model = 'gemini-2.5-flash';
        }
        try {
            const url = `${this.apiBase}/models/${model}:generateContent?key=${this.apiKey}`;
            const contents = [];
            for (const m of messages) {
                if (m.role === 'system')
                    continue;
                const role = m.role === 'assistant' ? 'model' : 'user';
                if (contents.length > 0 &&
                    contents[contents.length - 1].role === role) {
                    contents[contents.length - 1].parts[0].text += '\n' + m.content;
                }
                else {
                    contents.push({
                        role,
                        parts: [{ text: m.content }],
                    });
                }
            }
            const systemMsg = messages.find((m) => m.role === 'system');
            const body = {
                contents,
                generationConfig: {
                    temperature: Number(options.temperature),
                    maxOutputTokens: options.maxTokens,
                },
            };
            if (systemMsg || options.systemPrompt) {
                body.systemInstruction = {
                    parts: [{ text: systemMsg?.content || options.systemPrompt }],
                };
            }
            const timeoutMs = Number(this.configService.get('app.rag.requestTimeoutMs') ||
                process.env.RAG_REQUEST_TIMEOUT_MS ||
                30000);
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeoutMs);
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                    signal: controller.signal,
                });
                if (!res.ok) {
                    const errorText = await res.text();
                    throw new exceptions_1.ExternalApiException(`Gemini API Error: ${res.status} - ${errorText}`, 'RAG_GENERATION_FAILED', res.status);
                }
                const data = await res.json();
                const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                const promptTokens = data.usageMetadata?.promptTokenCount || 0;
                const completionTokens = data.usageMetadata?.candidatesTokenCount || 0;
                return {
                    content,
                    promptTokens,
                    completionTokens,
                };
            }
            catch (err) {
                if (err.name === 'AbortError') {
                    throw new exceptions_1.BusinessException('RAG LLM request timed out.', 'RAG_PROVIDER_TIMEOUT');
                }
                throw err;
            }
            finally {
                clearTimeout(id);
            }
        }
        catch (err) {
            if (err instanceof exceptions_2.BaseException) {
                throw err;
            }
            this.logger.error(`Gemini request failed: ${err.message}`);
            throw new exceptions_1.BusinessException(`Gemini LLM request failed: ${err.message}`, 'RAG_GENERATION_FAILED');
        }
    }
};
exports.GeminiLlmProvider = GeminiLlmProvider;
exports.GeminiLlmProvider = GeminiLlmProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GeminiLlmProvider);
const exceptions_2 = require("../../common/exceptions");
let OpenAiLlmProvider = class OpenAiLlmProvider {
    configService;
    apiKey;
    logger = new common_1.Logger('OpenAiLlmProvider');
    constructor(configService) {
        this.configService = configService;
        this.apiKey =
            this.configService.get('app.openai.apiKey', '') ||
                process.env.OPENAI_API_KEY ||
                '';
    }
    getProviderName() {
        return 'openai';
    }
    async healthCheck() {
        return (!!this.apiKey &&
            this.apiKey !== 'mock_key' &&
            this.apiKey !== 'mock_secret');
    }
    async chat(messages, options) {
        if (!this.apiKey ||
            this.apiKey === 'mock_key' ||
            this.apiKey === 'mock_secret') {
            throw new exceptions_1.BusinessException('RAG LLM provider "openai" is unconfigured. Please configure OPENAI_API_KEY.', 'RAG_PROVIDER_UNCONFIGURED');
        }
        const model = options.model ||
            this.configService.get('app.openai.llmModel') ||
            process.env.OPENAI_LLM_MODEL ||
            'gpt-4o-mini';
        try {
            const url = 'https://api.openai.com/v1/chat/completions';
            const payload = {
                model,
                messages: messages.map((m) => ({
                    role: m.role,
                    content: m.content,
                })),
                temperature: Number(options.temperature),
                max_tokens: options.maxTokens,
            };
            const timeoutMs = Number(this.configService.get('app.rag.requestTimeoutMs') ||
                process.env.RAG_REQUEST_TIMEOUT_MS ||
                30000);
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeoutMs);
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.apiKey}`,
                    },
                    body: JSON.stringify(payload),
                    signal: controller.signal,
                });
                if (!res.ok) {
                    const errorText = await res.text();
                    throw new exceptions_1.ExternalApiException(`OpenAI API Error: ${res.status} - ${errorText}`, 'RAG_GENERATION_FAILED', res.status);
                }
                const data = await res.json();
                const content = data.choices?.[0]?.message?.content || '';
                return {
                    content,
                    promptTokens: data.usage?.prompt_tokens || 0,
                    completionTokens: data.usage?.completion_tokens || 0,
                };
            }
            catch (err) {
                if (err.name === 'AbortError') {
                    throw new exceptions_1.BusinessException('RAG LLM request timed out.', 'RAG_PROVIDER_TIMEOUT');
                }
                throw err;
            }
            finally {
                clearTimeout(id);
            }
        }
        catch (err) {
            if (err instanceof exceptions_2.BaseException) {
                throw err;
            }
            this.logger.error(`OpenAI request failed: ${err.message}`);
            throw new exceptions_1.BusinessException(`OpenAI LLM request failed: ${err.message}`, 'RAG_GENERATION_FAILED');
        }
    }
};
exports.OpenAiLlmProvider = OpenAiLlmProvider;
exports.OpenAiLlmProvider = OpenAiLlmProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], OpenAiLlmProvider);
let GeminiEmbeddingProvider = class GeminiEmbeddingProvider {
    configService;
    apiKey;
    logger = new common_1.Logger('GeminiEmbeddingProvider');
    dimensions = 3072;
    constructor(configService) {
        this.configService = configService;
        this.apiKey =
            this.configService.get('app.gemini.apiKey', '') ||
                process.env.GEMINI_API_KEY ||
                '';
    }
    getProviderName() {
        return 'gemini';
    }
    async healthCheck() {
        return (!!this.apiKey &&
            this.apiKey !== 'mock_key' &&
            this.apiKey !== 'mock_secret');
    }
    async embed(text, model) {
        const vectors = await this.embedBatch([text], model);
        return vectors[0];
    }
    async embedBatch(texts, model) {
        if (!this.apiKey ||
            this.apiKey === 'mock_key' ||
            this.apiKey === 'mock_secret') {
            throw new exceptions_1.BusinessException('RAG Embedding provider "gemini" is unconfigured. Please configure GEMINI_API_KEY.', 'RAG_PROVIDER_UNCONFIGURED');
        }
        const isLlmModel = model &&
            (model.includes('flash') ||
                model.includes('pro') ||
                model.includes('gpt') ||
                model.includes('claude'));
        const resolvedModel = model && !isLlmModel ? model : undefined;
        let embedModel = resolvedModel ||
            this.configService.get('app.gemini.embeddingModel') ||
            process.env.GEMINI_EMBEDDING_MODEL ||
            'gemini-embedding-2';
        if (embedModel === 'text-embedding-004') {
            embedModel = 'gemini-embedding-2';
        }
        try {
            const formattedModel = embedModel.startsWith('models/')
                ? embedModel
                : `models/${embedModel}`;
            const url = `https://generativelanguage.googleapis.com/v1beta/${formattedModel}:batchEmbedContents?key=${this.apiKey}`;
            const requests = texts.map((text) => ({
                model: formattedModel,
                content: { parts: [{ text }] },
            }));
            const timeoutMs = Number(this.configService.get('app.rag.requestTimeoutMs') ||
                process.env.RAG_REQUEST_TIMEOUT_MS ||
                30000);
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeoutMs);
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ requests }),
                    signal: controller.signal,
                });
                if (!res.ok) {
                    const errorText = await res.text();
                    throw new exceptions_1.ExternalApiException(`Gemini API Error: ${res.status} - ${errorText}`, 'RAG_EMBEDDING_FAILED', res.status);
                }
                const data = await res.json();
                const embeddingsList = data.embeddings;
                if (!embeddingsList || !Array.isArray(embeddingsList)) {
                    throw new exceptions_1.BusinessException('Failed to retrieve embeddings from Gemini batch API.', 'RAG_EMBEDDING_FAILED');
                }
                const results = [];
                for (const item of embeddingsList) {
                    const values = item.values;
                    if (!values || !Array.isArray(values)) {
                        throw new exceptions_1.BusinessException('Invalid embedding format returned from Gemini API.', 'RAG_EMBEDDING_FAILED');
                    }
                    if (values.length !== this.dimensions) {
                        throw new exceptions_1.BusinessException(`Embedding dimension mismatch. Expected ${this.dimensions}, got ${values.length}.`, 'RAG_EMBEDDING_DIMENSION_MISMATCH');
                    }
                    results.push(values);
                }
                return results;
            }
            catch (err) {
                if (err.name === 'AbortError') {
                    throw new exceptions_1.BusinessException('RAG Embedding request timed out.', 'RAG_PROVIDER_TIMEOUT');
                }
                throw err;
            }
            finally {
                clearTimeout(id);
            }
        }
        catch (err) {
            if (err instanceof exceptions_2.BaseException) {
                throw err;
            }
            this.logger.error(`Gemini embedding failed: ${err.message}`);
            throw new exceptions_1.BusinessException(`Gemini Embedding generation failed: ${err.message}`, 'RAG_EMBEDDING_FAILED');
        }
    }
};
exports.GeminiEmbeddingProvider = GeminiEmbeddingProvider;
exports.GeminiEmbeddingProvider = GeminiEmbeddingProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GeminiEmbeddingProvider);
let OpenAiEmbeddingProvider = class OpenAiEmbeddingProvider {
    configService;
    apiKey;
    logger = new common_1.Logger('OpenAiEmbeddingProvider');
    dimensions = 1536;
    constructor(configService) {
        this.configService = configService;
        this.apiKey =
            this.configService.get('app.openai.apiKey', '') ||
                process.env.OPENAI_API_KEY ||
                '';
    }
    getProviderName() {
        return 'openai';
    }
    async healthCheck() {
        return (!!this.apiKey &&
            this.apiKey !== 'mock_key' &&
            this.apiKey !== 'mock_secret');
    }
    async embed(text, model) {
        const vectors = await this.embedBatch([text], model);
        return vectors[0];
    }
    async embedBatch(texts, model) {
        if (!this.apiKey ||
            this.apiKey === 'mock_key' ||
            this.apiKey === 'mock_secret') {
            throw new exceptions_1.BusinessException('RAG Embedding provider "openai" is unconfigured. Please configure OPENAI_API_KEY.', 'RAG_PROVIDER_UNCONFIGURED');
        }
        const isLlmModel = model &&
            (model.includes('gpt') ||
                model.includes('flash') ||
                model.includes('pro') ||
                model.includes('claude'));
        const resolvedModel = model && !isLlmModel ? model : undefined;
        const embedModel = resolvedModel ||
            this.configService.get('app.openai.embeddingModel') ||
            process.env.OPENAI_EMBEDDING_MODEL ||
            'text-embedding-3-small';
        try {
            const url = 'https://api.openai.com/v1/embeddings';
            const timeoutMs = Number(this.configService.get('app.rag.requestTimeoutMs') ||
                process.env.RAG_REQUEST_TIMEOUT_MS ||
                30000);
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeoutMs);
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.apiKey}`,
                    },
                    body: JSON.stringify({
                        input: texts,
                        model: embedModel,
                    }),
                    signal: controller.signal,
                });
                if (!res.ok) {
                    const errorText = await res.text();
                    throw new exceptions_1.ExternalApiException(`OpenAI API Error: ${res.status} - ${errorText}`, 'RAG_EMBEDDING_FAILED', res.status);
                }
                const data = await res.json();
                if (!data.data || !Array.isArray(data.data)) {
                    throw new exceptions_1.BusinessException('Failed to retrieve embeddings from OpenAI API.', 'RAG_EMBEDDING_FAILED');
                }
                const results = data.data.map((item) => item.embedding);
                for (const embedding of results) {
                    if (embedding.length !== this.dimensions) {
                        throw new exceptions_1.BusinessException(`Embedding dimension mismatch. Expected ${this.dimensions}, got ${embedding.length}.`, 'RAG_EMBEDDING_DIMENSION_MISMATCH');
                    }
                }
                return results;
            }
            catch (err) {
                if (err.name === 'AbortError') {
                    throw new exceptions_1.BusinessException('RAG Embedding request timed out.', 'RAG_PROVIDER_TIMEOUT');
                }
                throw err;
            }
            finally {
                clearTimeout(id);
            }
        }
        catch (err) {
            if (err instanceof exceptions_2.BaseException) {
                throw err;
            }
            this.logger.error(`OpenAI embedding failed: ${err.message}`);
            throw new exceptions_1.BusinessException(`OpenAI Embedding generation failed: ${err.message}`, 'RAG_EMBEDDING_FAILED');
        }
    }
};
exports.OpenAiEmbeddingProvider = OpenAiEmbeddingProvider;
exports.OpenAiEmbeddingProvider = OpenAiEmbeddingProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], OpenAiEmbeddingProvider);
let LlmProviderRegistry = class LlmProviderRegistry {
    providers = new Map();
    constructor(gemini, openai) {
        this.providers.set(gemini.getProviderName(), gemini);
        this.providers.set(openai.getProviderName(), openai);
    }
    getProvider(name) {
        const provider = this.providers.get(name.toLowerCase());
        if (!provider) {
            throw new exceptions_1.BusinessException(`LLM provider "${name}" is unknown or unsupported.`, 'RAG_PROVIDER_UNKNOWN');
        }
        return provider;
    }
};
exports.LlmProviderRegistry = LlmProviderRegistry;
exports.LlmProviderRegistry = LlmProviderRegistry = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [GeminiLlmProvider, OpenAiLlmProvider])
], LlmProviderRegistry);
let EmbeddingProviderRegistry = class EmbeddingProviderRegistry {
    providers = new Map();
    constructor(gemini, openai) {
        this.providers.set(gemini.getProviderName(), gemini);
        this.providers.set(openai.getProviderName(), openai);
    }
    getProvider(name) {
        const provider = this.providers.get(name.toLowerCase());
        if (!provider) {
            throw new exceptions_1.BusinessException(`Embedding provider "${name}" is unknown or unsupported.`, 'RAG_PROVIDER_UNKNOWN');
        }
        return provider;
    }
};
exports.EmbeddingProviderRegistry = EmbeddingProviderRegistry;
exports.EmbeddingProviderRegistry = EmbeddingProviderRegistry = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [GeminiEmbeddingProvider,
        OpenAiEmbeddingProvider])
], EmbeddingProviderRegistry);
//# sourceMappingURL=rag-providers.service.js.map