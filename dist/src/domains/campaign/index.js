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
exports.CampaignService = exports.CampaignModule = void 0;
var campaign_module_1 = require("./campaign.module");
Object.defineProperty(exports, "CampaignModule", { enumerable: true, get: function () { return campaign_module_1.CampaignModule; } });
var campaign_service_1 = require("./campaign.service");
Object.defineProperty(exports, "CampaignService", { enumerable: true, get: function () { return campaign_service_1.CampaignService; } });
__exportStar(require("./campaign.types"), exports);
//# sourceMappingURL=index.js.map