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
exports.FaqService = exports.FaqModule = void 0;
var faq_module_1 = require("./faq.module");
Object.defineProperty(exports, "FaqModule", { enumerable: true, get: function () { return faq_module_1.FaqModule; } });
var faq_service_1 = require("./faq.service");
Object.defineProperty(exports, "FaqService", { enumerable: true, get: function () { return faq_service_1.FaqService; } });
__exportStar(require("./faq.types"), exports);
//# sourceMappingURL=index.js.map