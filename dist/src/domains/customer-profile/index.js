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
exports.CustomerProfileService = exports.CustomerProfileModule = void 0;
var customer_profile_module_1 = require("./customer-profile.module");
Object.defineProperty(exports, "CustomerProfileModule", { enumerable: true, get: function () { return customer_profile_module_1.CustomerProfileModule; } });
var customer_profile_service_1 = require("./customer-profile.service");
Object.defineProperty(exports, "CustomerProfileService", { enumerable: true, get: function () { return customer_profile_service_1.CustomerProfileService; } });
__exportStar(require("./customer-profile.types"), exports);
//# sourceMappingURL=index.js.map