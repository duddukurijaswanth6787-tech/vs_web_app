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
exports.CustomerAddressService = exports.CustomerAddressModule = void 0;
var customer_address_module_1 = require("./customer-address.module");
Object.defineProperty(exports, "CustomerAddressModule", { enumerable: true, get: function () { return customer_address_module_1.CustomerAddressModule; } });
var customer_address_service_1 = require("./customer-address.service");
Object.defineProperty(exports, "CustomerAddressService", { enumerable: true, get: function () { return customer_address_service_1.CustomerAddressService; } });
__exportStar(require("./customer-address.types"), exports);
//# sourceMappingURL=index.js.map