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
exports.ReportService = exports.ReportModule = void 0;
var report_module_1 = require("./report.module");
Object.defineProperty(exports, "ReportModule", { enumerable: true, get: function () { return report_module_1.ReportModule; } });
var report_service_1 = require("./report.service");
Object.defineProperty(exports, "ReportService", { enumerable: true, get: function () { return report_service_1.ReportService; } });
__exportStar(require("./report.types"), exports);
//# sourceMappingURL=index.js.map