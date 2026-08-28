"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuccessResponse = SuccessResponse;
exports.CreatedResponse = CreatedResponse;
exports.PaginatedResponse = PaginatedResponse;
exports.ApiErrorResponse = ApiErrorResponse;
exports.ApiValidationResponse = ApiValidationResponse;
exports.EmptyResponse = EmptyResponse;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const response_dto_1 = require("../responses/response.dto");
const swagger_examples_1 = require("../../core/swagger/swagger.examples");
function SuccessResponse(model, message = 'Request processed successfully') {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiExtraModels)(response_dto_1.StandardApiResponse, model), (0, swagger_1.ApiOkResponse)({
        description: message,
        schema: {
            allOf: [
                { $ref: (0, swagger_1.getSchemaPath)(response_dto_1.StandardApiResponse) },
                {
                    properties: {
                        data: { $ref: (0, swagger_1.getSchemaPath)(model) },
                    },
                },
            ],
        },
    }));
}
function CreatedResponse(model, message = 'Resource created successfully') {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiExtraModels)(response_dto_1.StandardApiResponse, model), (0, swagger_1.ApiCreatedResponse)({
        description: message,
        schema: {
            allOf: [
                { $ref: (0, swagger_1.getSchemaPath)(response_dto_1.StandardApiResponse) },
                {
                    properties: {
                        data: { $ref: (0, swagger_1.getSchemaPath)(model) },
                    },
                },
            ],
        },
    }));
}
function PaginatedResponse(model, message = 'Data retrieved successfully') {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiExtraModels)(response_dto_1.PaginatedApiResponse, model), (0, swagger_1.ApiOkResponse)({
        description: message,
        schema: {
            allOf: [
                { $ref: (0, swagger_1.getSchemaPath)(response_dto_1.PaginatedApiResponse) },
                {
                    properties: {
                        data: {
                            type: 'array',
                            items: { $ref: (0, swagger_1.getSchemaPath)(model) },
                        },
                    },
                },
            ],
        },
    }));
}
function ApiErrorResponse() {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Business or system error occurred',
        content: {
            'application/json': {
                example: swagger_examples_1.API_RESPONSE_EXAMPLES.ERROR.value,
            },
        },
    }));
}
function ApiValidationResponse() {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiBadRequestResponse)({
        description: 'Request validation failed',
        content: {
            'application/json': {
                example: swagger_examples_1.API_RESPONSE_EXAMPLES.VALIDATION_ERROR.value,
            },
        },
    }));
}
function EmptyResponse(message = 'No content available') {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiExtraModels)(response_dto_1.StandardApiResponse), (0, swagger_1.ApiOkResponse)({
        description: message,
        schema: {
            allOf: [
                { $ref: (0, swagger_1.getSchemaPath)(response_dto_1.StandardApiResponse) },
                {
                    properties: {
                        data: { type: 'null', default: null },
                    },
                },
            ],
        },
    }));
}
//# sourceMappingURL=response.decorator.js.map