"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogService = LogService;
exports.LogController = LogController;
exports.LogPerformance = LogPerformance;
const common_1 = require("@nestjs/common");
const perf_hooks_1 = require("perf_hooks");
function LogService() {
    const logger = new common_1.Logger('ServiceTracker');
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args) {
            const className = target.constructor?.name || 'UnknownService';
            const methodName = String(propertyKey);
            logger.log(`[${className}] Calling ${methodName}()`);
            try {
                const result = originalMethod.apply(this, args);
                if (result instanceof Promise) {
                    return result
                        .then((res) => {
                        logger.log(`[${className}] Successfully resolved ${methodName}()`);
                        return res;
                    })
                        .catch((err) => {
                        logger.error(`[${className}] Exception in async ${methodName}(): ${err.message}`, err.stack);
                        throw err;
                    });
                }
                logger.log(`[${className}] Successfully returned ${methodName}()`);
                return result;
            }
            catch (err) {
                const error = err;
                logger.error(`[${className}] Exception in ${methodName}(): ${error.message}`, error.stack);
                throw err;
            }
        };
        return descriptor;
    };
}
function LogController() {
    const logger = new common_1.Logger('ControllerTracker');
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args) {
            const className = target.constructor?.name || 'UnknownController';
            const methodName = String(propertyKey);
            logger.log(`[${className}] Route Handler triggered: ${methodName}()`);
            try {
                const result = originalMethod.apply(this, args);
                if (result instanceof Promise) {
                    return result
                        .then((res) => {
                        logger.log(`[${className}] Route Handler successfully processed: ${methodName}()`);
                        return res;
                    })
                        .catch((err) => {
                        logger.error(`[${className}] Route Handler threw async exception in ${methodName}(): ${err.message}`);
                        throw err;
                    });
                }
                logger.log(`[${className}] Route Handler successfully processed: ${methodName}()`);
                return result;
            }
            catch (err) {
                const error = err;
                logger.error(`[${className}] Route Handler threw exception in ${methodName}(): ${error.message}`);
                throw err;
            }
        };
        return descriptor;
    };
}
function LogPerformance(slowThresholdMs = 500) {
    const logger = new common_1.Logger('PerformanceTracker');
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args) {
            const className = target.constructor?.name || 'Class';
            const methodName = String(propertyKey);
            const start = perf_hooks_1.performance.now();
            const logTime = (timeTaken) => {
                const msg = `[${className}] ${methodName}() took ${timeTaken.toFixed(2)}ms`;
                if (timeTaken > slowThresholdMs) {
                    logger.warn(`SLOW METHOD WARNING: ${msg}`);
                }
                else {
                    logger.log(msg);
                }
            };
            try {
                const result = originalMethod.apply(this, args);
                if (result instanceof Promise) {
                    return result.then((res) => {
                        const end = perf_hooks_1.performance.now();
                        logTime(end - start);
                        return res;
                    });
                }
                const end = perf_hooks_1.performance.now();
                logTime(end - start);
                return result;
            }
            catch (err) {
                const end = perf_hooks_1.performance.now();
                logTime(end - start);
                throw err;
            }
        };
        return descriptor;
    };
}
//# sourceMappingURL=logger.decorator.js.map