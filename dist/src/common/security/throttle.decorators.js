"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThrottleSignup = exports.ThrottleOtpVerify = exports.ThrottleOtpSend = exports.ThrottleCredentials = void 0;
const throttler_1 = require("@nestjs/throttler");
const minutes = (n) => n * 60 * 1000;
const ThrottleCredentials = () => (0, throttler_1.Throttle)({ default: { limit: 10, ttl: minutes(15) } });
exports.ThrottleCredentials = ThrottleCredentials;
const ThrottleOtpSend = () => (0, throttler_1.Throttle)({ default: { limit: 5, ttl: minutes(15) } });
exports.ThrottleOtpSend = ThrottleOtpSend;
const ThrottleOtpVerify = () => (0, throttler_1.Throttle)({ default: { limit: 15, ttl: minutes(15) } });
exports.ThrottleOtpVerify = ThrottleOtpVerify;
const ThrottleSignup = () => (0, throttler_1.Throttle)({ default: { limit: 5, ttl: minutes(60) } });
exports.ThrottleSignup = ThrottleSignup;
//# sourceMappingURL=throttle.decorators.js.map