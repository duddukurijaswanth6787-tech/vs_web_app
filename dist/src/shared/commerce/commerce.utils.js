"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DimensionFormatter = exports.WeightFormatter = exports.PriceFormatter = exports.BarcodeGenerator = exports.SlugGenerator = exports.SkuGenerator = void 0;
exports.buildPaginationMeta = buildPaginationMeta;
exports.generateUnique = generateUnique;
const node_crypto_1 = require("node:crypto");
const commerce_constants_1 = require("./commerce.constants");
class SkuGenerator {
    static generate(productCode) {
        const prefix = commerce_constants_1.COMMERCE_CONSTANTS.SKU_PREFIX;
        const code = (productCode ?? '').slice(0, 3).toUpperCase();
        const rand = (0, node_crypto_1.randomBytes)(4).toString('hex').toUpperCase().slice(0, 4);
        return `${prefix}${code}${rand}`;
    }
}
exports.SkuGenerator = SkuGenerator;
class SlugGenerator {
    static generate(name) {
        return name
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, commerce_constants_1.COMMERCE_CONSTANTS.SLUG_MAX_LENGTH);
    }
}
exports.SlugGenerator = SlugGenerator;
class BarcodeGenerator {
    static generate() {
        const prefix = commerce_constants_1.COMMERCE_CONSTANTS.BARCODE_PREFIX;
        const rand = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
        const raw = `${prefix}${rand}`;
        const checksum = raw
            .split('')
            .reduce((sum, d, i) => sum + parseInt(d) * (i % 2 === 0 ? 1 : 3), 0);
        const checkDigit = (10 - (checksum % 10)) % 10;
        return `${raw}${checkDigit}`;
    }
}
exports.BarcodeGenerator = BarcodeGenerator;
class PriceFormatter {
    static format(amount) {
        return parseFloat(amount.toFixed(commerce_constants_1.COMMERCE_CONSTANTS.PRICE_PRECISION));
    }
}
exports.PriceFormatter = PriceFormatter;
class WeightFormatter {
    static format(grams) {
        return parseFloat(grams.toFixed(commerce_constants_1.COMMERCE_CONSTANTS.WEIGHT_PRECISION));
    }
}
exports.WeightFormatter = WeightFormatter;
class DimensionFormatter {
    static format(cm) {
        return parseFloat(cm.toFixed(commerce_constants_1.COMMERCE_CONSTANTS.DIMENSION_PRECISION));
    }
}
exports.DimensionFormatter = DimensionFormatter;
function buildPaginationMeta(page, limit, total) {
    const totalPages = Math.ceil(total / limit) || 1;
    return {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
    };
}
async function generateUnique(generator, checker) {
    let val = generator();
    while (await checker(val))
        val = generator();
    return val;
}
//# sourceMappingURL=commerce.utils.js.map