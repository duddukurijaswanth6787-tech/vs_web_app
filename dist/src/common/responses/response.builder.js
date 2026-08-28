"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseBuilder = exports.ResponsePayload = void 0;
const common_1 = require("@nestjs/common");
class ResponsePayload {
    statusCode;
    message;
    data;
    customMeta;
    constructor(statusCode, message, data, customMeta) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.customMeta = customMeta;
    }
}
exports.ResponsePayload = ResponsePayload;
class ResponseBuilder {
    static success(data, message = 'Request processed successfully', metadata) {
        return new ResponsePayload(common_1.HttpStatus.OK, message, data, metadata);
    }
    static created(data, message = 'Resource created successfully', metadata) {
        return new ResponsePayload(common_1.HttpStatus.CREATED, message, data, metadata);
    }
    static updated(data, message = 'Resource updated successfully', metadata) {
        return new ResponsePayload(common_1.HttpStatus.OK, message, data, metadata);
    }
    static deleted(message = 'Resource deleted successfully', metadata) {
        return new ResponsePayload(common_1.HttpStatus.OK, message, null, metadata);
    }
}
exports.ResponseBuilder = ResponseBuilder;
//# sourceMappingURL=response.builder.js.map