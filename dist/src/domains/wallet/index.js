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
exports.WalletService = exports.WalletModule = void 0;
var wallet_module_1 = require("./wallet.module");
Object.defineProperty(exports, "WalletModule", { enumerable: true, get: function () { return wallet_module_1.WalletModule; } });
var wallet_service_1 = require("./wallet.service");
Object.defineProperty(exports, "WalletService", { enumerable: true, get: function () { return wallet_service_1.WalletService; } });
__exportStar(require("./wallet.types"), exports);
//# sourceMappingURL=index.js.map