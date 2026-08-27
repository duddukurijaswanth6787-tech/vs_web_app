"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReturnRequestService = exports.ReturnRequestModule = void 0;
var return_request_module_1 = require("./return-request.module");
Object.defineProperty(exports, "ReturnRequestModule", { enumerable: true, get: function () { return return_request_module_1.ReturnRequestModule; } });
var return_request_service_1 = require("./return-request.service");
Object.defineProperty(exports, "ReturnRequestService", { enumerable: true, get: function () { return return_request_service_1.ReturnRequestService; } });
__exportStar(require("./return-request.types"), exports);
//# sourceMappingURL=index.js.map