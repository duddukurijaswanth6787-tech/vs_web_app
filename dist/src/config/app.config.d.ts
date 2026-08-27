declare const _default: (() => {
    env: string;
    port: number;
    database: {
        url: string | undefined;
        slowQueryThreshold: number;
    };
    redis: {
        host: string;
        port: number;
        password: string;
        db: number;
    };
    bullmq: {
        prefix: string;
    };
    throttle: {
        ttl: number;
        limit: number;
    };
    cors: {
        origin: string;
        methods: string;
        allowedHeaders: string;
    };
    security: {
        trustProxyCount: number;
        bodyJsonLimit: string;
        bodyUrlencodedLimit: string;
        helmetCspEnabled: boolean;
        helmetCoepEnabled: boolean;
        eventLogEnabled: boolean;
    };
    storage: {
        provider: string;
        maxFileSize: number;
        allowedMimeTypes: string;
        root: string;
        publicUrl: string;
        s3: {
            region: string;
            bucket: string;
            accessKeyId: string;
            secretAccessKey: string;
            endpoint: string | undefined;
            publicUrl: string;
            forcePathStyle: boolean;
            signedUrlExpiry: number;
        };
    };
    razorpay: {
        keyId: string;
        keySecret: string;
        webhookSecret: string;
        apiBaseUrl: string;
        enabled: boolean;
        provider: string;
    };
    jwt: {
        secret: string | undefined;
        expiresIn: number;
        rememberMeExpiresIn: number;
        refreshTokenExpiryDays: number;
        issuer: string;
    };
    hostname: string;
    monitoring: {
        enabled: boolean;
        slowRequestThreshold: number;
    };
    features: {
        swagger: boolean;
        redis: boolean;
        bullmq: boolean;
        email: boolean;
        sms: boolean;
        storage: boolean;
        queue: boolean;
        logger: boolean;
    };
    sms: {
        provider: string;
        apiKey: string;
        senderId: string;
    };
    startMessaging: {
        apiKey: string;
        baseUrl: string;
    };
    email: {
        smtpHost: string;
        smtpPort: number;
        smtpSecure: boolean;
        smtpUser: string;
        smtpPassword: string;
        fromAddress: string;
        fromName: string;
    };
    frontendUrl: string;
    firebase: {
        projectId: string;
        clientEmail: string;
        privateKey: string;
    };
    google: {
        clientId: string;
    };
    push: {
        enabled: boolean;
        serverKey: string;
        provider: string;
    };
    dtdc: {
        enabled: boolean;
        apiKey: string;
        customerCode: string;
        apiUrl: string;
    };
    httpLog: {
        enabled: boolean;
        requestBody: boolean;
        responseBody: boolean;
        maxBodyLength: number;
        healthRequests: boolean;
        successRequests: boolean;
    };
    rag: {
        enabled: boolean;
        llmProvider: string;
        embeddingProvider: string;
        requestTimeoutMs: number;
    };
    gemini: {
        apiKey: string;
        llmModel: string;
        embeddingModel: string;
    };
    openai: {
        apiKey: string;
        llmModel: string;
        embeddingModel: string;
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    env: string;
    port: number;
    database: {
        url: string | undefined;
        slowQueryThreshold: number;
    };
    redis: {
        host: string;
        port: number;
        password: string;
        db: number;
    };
    bullmq: {
        prefix: string;
    };
    throttle: {
        ttl: number;
        limit: number;
    };
    cors: {
        origin: string;
        methods: string;
        allowedHeaders: string;
    };
    security: {
        trustProxyCount: number;
        bodyJsonLimit: string;
        bodyUrlencodedLimit: string;
        helmetCspEnabled: boolean;
        helmetCoepEnabled: boolean;
        eventLogEnabled: boolean;
    };
    storage: {
        provider: string;
        maxFileSize: number;
        allowedMimeTypes: string;
        root: string;
        publicUrl: string;
        s3: {
            region: string;
            bucket: string;
            accessKeyId: string;
            secretAccessKey: string;
            endpoint: string | undefined;
            publicUrl: string;
            forcePathStyle: boolean;
            signedUrlExpiry: number;
        };
    };
    razorpay: {
        keyId: string;
        keySecret: string;
        webhookSecret: string;
        apiBaseUrl: string;
        enabled: boolean;
        provider: string;
    };
    jwt: {
        secret: string | undefined;
        expiresIn: number;
        rememberMeExpiresIn: number;
        refreshTokenExpiryDays: number;
        issuer: string;
    };
    hostname: string;
    monitoring: {
        enabled: boolean;
        slowRequestThreshold: number;
    };
    features: {
        swagger: boolean;
        redis: boolean;
        bullmq: boolean;
        email: boolean;
        sms: boolean;
        storage: boolean;
        queue: boolean;
        logger: boolean;
    };
    sms: {
        provider: string;
        apiKey: string;
        senderId: string;
    };
    startMessaging: {
        apiKey: string;
        baseUrl: string;
    };
    email: {
        smtpHost: string;
        smtpPort: number;
        smtpSecure: boolean;
        smtpUser: string;
        smtpPassword: string;
        fromAddress: string;
        fromName: string;
    };
    frontendUrl: string;
    firebase: {
        projectId: string;
        clientEmail: string;
        privateKey: string;
    };
    google: {
        clientId: string;
    };
    push: {
        enabled: boolean;
        serverKey: string;
        provider: string;
    };
    dtdc: {
        enabled: boolean;
        apiKey: string;
        customerCode: string;
        apiUrl: string;
    };
    httpLog: {
        enabled: boolean;
        requestBody: boolean;
        responseBody: boolean;
        maxBodyLength: number;
        healthRequests: boolean;
        successRequests: boolean;
    };
    rag: {
        enabled: boolean;
        llmProvider: string;
        embeddingProvider: string;
        requestTimeoutMs: number;
    };
    gemini: {
        apiKey: string;
        llmModel: string;
        embeddingModel: string;
    };
    openai: {
        apiKey: string;
        llmModel: string;
        embeddingModel: string;
    };
}>;
export default _default;
