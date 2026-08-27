"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionMapper = exports.ShippingException = exports.PaymentException = exports.FileUploadException = exports.AuthorizationException = exports.AuthenticationException = exports.ExternalApiException = exports.InfrastructureException = exports.DatabaseException = exports.PassthroughHttpException = exports.InternalServerException = exports.ResourceNotFoundException = exports.ValidationException = exports.BusinessException = exports.BaseException = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
class BaseException extends common_1.HttpException {
    errorCode;
    timestamp;
    metadata;
    constructor(message, errorCode, status, metadata = {}) {
        super(message, status);
        this.errorCode = errorCode;
        this.timestamp = new Date().toISOString();
        this.metadata = metadata;
    }
}
exports.BaseException = BaseException;
class BusinessException extends BaseException {
    constructor(message, errorCode, metadata) {
        super(message, errorCode, common_1.HttpStatus.UNPROCESSABLE_ENTITY, metadata);
    }
}
exports.BusinessException = BusinessException;
class ValidationException extends BaseException {
    constructor(message, errorCode, metadata) {
        super(message, errorCode, common_1.HttpStatus.BAD_REQUEST, metadata);
    }
}
exports.ValidationException = ValidationException;
class ResourceNotFoundException extends BaseException {
    constructor(message, errorCode, metadata) {
        super(message, errorCode, common_1.HttpStatus.NOT_FOUND, metadata);
    }
}
exports.ResourceNotFoundException = ResourceNotFoundException;
class InternalServerException extends BaseException {
    constructor(message, errorCode, metadata) {
        super(message, errorCode, common_1.HttpStatus.INTERNAL_SERVER_ERROR, metadata);
    }
}
exports.InternalServerException = InternalServerException;
class PassthroughHttpException extends BaseException {
    constructor(message, errorCode, status, metadata) {
        super(message, errorCode, status, metadata);
    }
}
exports.PassthroughHttpException = PassthroughHttpException;
class DatabaseException extends BaseException {
    constructor(message, errorCode, status = common_1.HttpStatus.BAD_REQUEST, metadata) {
        super(message, errorCode, status, metadata);
    }
}
exports.DatabaseException = DatabaseException;
class InfrastructureException extends BaseException {
    constructor(message, errorCode, metadata) {
        super(message, errorCode, common_1.HttpStatus.INTERNAL_SERVER_ERROR, metadata);
    }
}
exports.InfrastructureException = InfrastructureException;
class ExternalApiException extends BaseException {
    constructor(message, errorCode, status = common_1.HttpStatus.BAD_GATEWAY, metadata) {
        super(message, errorCode, status, metadata);
    }
}
exports.ExternalApiException = ExternalApiException;
class AuthenticationException extends BaseException {
    constructor(message, errorCode, metadata) {
        super(message, errorCode, common_1.HttpStatus.UNAUTHORIZED, metadata);
    }
}
exports.AuthenticationException = AuthenticationException;
class AuthorizationException extends BaseException {
    constructor(message, errorCode, metadata) {
        super(message, errorCode, common_1.HttpStatus.FORBIDDEN, metadata);
    }
}
exports.AuthorizationException = AuthorizationException;
class FileUploadException extends BaseException {
    constructor(message, errorCode, metadata) {
        super(message, errorCode, common_1.HttpStatus.BAD_REQUEST, metadata);
    }
}
exports.FileUploadException = FileUploadException;
class PaymentException extends BaseException {
    constructor(message, errorCode, metadata) {
        super(message, errorCode, common_1.HttpStatus.PAYMENT_REQUIRED, metadata);
    }
}
exports.PaymentException = PaymentException;
class ShippingException extends BaseException {
    constructor(message, errorCode, metadata) {
        super(message, errorCode, common_1.HttpStatus.BAD_REQUEST, metadata);
    }
}
exports.ShippingException = ShippingException;
class GlobalExceptionMapper {
    static map(exception) {
        if (exception instanceof BaseException) {
            return exception;
        }
        if (exception instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            const err = exception;
            switch (err.code) {
                case 'P2002': {
                    const target = err.meta?.target || [];
                    return new DatabaseException(`Duplicate entry field violation: (${target.join(', ')})`, 'DATABASE_CONSTRAINT', common_1.HttpStatus.CONFLICT, { target });
                }
                case 'P2025': {
                    return new DatabaseException(err.meta?.cause || 'Database record not found', 'DATABASE_RECORD_NOT_FOUND', common_1.HttpStatus.NOT_FOUND);
                }
                case 'P2003': {
                    return new DatabaseException('Foreign key constraint failed', 'DATABASE_CONSTRAINT', common_1.HttpStatus.BAD_REQUEST);
                }
                default: {
                    const cleanMsg = process.env.NODE_ENV === 'production' ||
                        process.env.APP_ENV === 'production'
                        ? 'Database operation failed. Please try again later.'
                        : `Database operation failed: ${err.message}`;
                    return new DatabaseException(cleanMsg, 'DATABASE_CONNECTION', common_1.HttpStatus.BAD_REQUEST);
                }
            }
        }
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const res = exception.getResponse();
            let message = exception.message;
            let errorCode = 'SYSTEM_001';
            let metadata = {};
            if (typeof res === 'object' && res !== null) {
                const resObj = res;
                const msgVal = resObj['message'];
                if (Array.isArray(msgVal)) {
                    message = msgVal.join(', ');
                    errorCode = 'INVALID_INPUT';
                    metadata = { validationErrors: msgVal };
                    return new ValidationException(message, errorCode, metadata);
                }
                else if (typeof msgVal === 'string') {
                    message = msgVal;
                }
            }
            if (status === common_1.HttpStatus.UNAUTHORIZED) {
                return new AuthenticationException(message, 'AUTH_001', metadata);
            }
            if (status === common_1.HttpStatus.FORBIDDEN) {
                return new AuthorizationException(message, 'AUTH_002', metadata);
            }
            if (status === common_1.HttpStatus.NOT_FOUND) {
                return new ResourceNotFoundException(message, 'RESOURCE_NOT_FOUND', metadata);
            }
            return new PassthroughHttpException(message, errorCode, status, metadata);
        }
        if (exception instanceof Error) {
            const cleanMsg = process.env.NODE_ENV === 'production' ||
                process.env.APP_ENV === 'production'
                ? 'An unexpected error occurred.'
                : exception.message;
            return new InternalServerException(cleanMsg, 'SYSTEM_001');
        }
        return new InternalServerException('An unexpected error occurred', 'SYSTEM_001');
    }
}
exports.GlobalExceptionMapper = GlobalExceptionMapper;
//# sourceMappingURL=index.js.map