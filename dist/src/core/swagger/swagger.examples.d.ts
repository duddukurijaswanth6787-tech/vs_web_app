export declare const API_RESPONSE_EXAMPLES: {
    readonly SUCCESS: {
        readonly value: {
            readonly success: true;
            readonly statusCode: 200;
            readonly message: "Request processed successfully";
            readonly data: {};
            readonly meta: {
                readonly timestamp: "2026-07-09T10:20:00.000Z";
                readonly correlationId: "550e8400-e29b-41d4-a716-446655440000";
                readonly path: "/api/v1/resource";
                readonly apiVersion: "1.0.0";
            };
        };
    };
    readonly CREATED: {
        readonly value: {
            readonly success: true;
            readonly statusCode: 201;
            readonly message: "Resource created successfully";
            readonly data: {};
            readonly meta: {
                readonly timestamp: "2026-07-09T10:20:00.000Z";
                readonly correlationId: "550e8400-e29b-41d4-a716-446655440000";
                readonly path: "/api/v1/resource";
                readonly apiVersion: "1.0.0";
            };
        };
    };
    readonly PAGINATED: {
        readonly value: {
            readonly success: true;
            readonly statusCode: 200;
            readonly message: "Records retrieved successfully";
            readonly data: readonly [];
            readonly meta: {
                readonly timestamp: "2026-07-09T10:20:00.000Z";
                readonly correlationId: "550e8400-e29b-41d4-a716-446655440000";
                readonly path: "/api/v1/resource";
                readonly apiVersion: "1.0.0";
                readonly pagination: {
                    readonly page: 1;
                    readonly limit: 10;
                    readonly total: 100;
                    readonly totalPages: 10;
                    readonly hasNext: true;
                    readonly hasPrevious: false;
                };
            };
        };
    };
    readonly ERROR: {
        readonly value: {
            readonly success: false;
            readonly error: "BusinessException";
            readonly code: "BUSINESS_RULE_FAILED";
            readonly message: "A business rule validation failed";
            readonly timestamp: "2026-07-09T10:20:00.000Z";
            readonly correlationId: "550e8400-e29b-41d4-a716-446655440000";
            readonly path: "/api/v1/resource";
            readonly metadata: {};
        };
    };
    readonly VALIDATION_ERROR: {
        readonly value: {
            readonly success: false;
            readonly error: "ValidationException";
            readonly code: "INVALID_INPUT";
            readonly message: "email: email must be a valid email address";
            readonly timestamp: "2026-07-09T10:20:00.000Z";
            readonly correlationId: "550e8400-e29b-41d4-a716-446655440000";
            readonly path: "/api/v1/resource";
            readonly metadata: {
                readonly validationErrors: readonly ["email: email must be a valid email address"];
            };
        };
    };
};
