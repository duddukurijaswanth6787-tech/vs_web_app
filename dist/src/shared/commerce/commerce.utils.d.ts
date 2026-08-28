export declare class SkuGenerator {
    static generate(productCode?: string): string;
}
export declare class SlugGenerator {
    static generate(name: string): string;
}
export declare class BarcodeGenerator {
    static generate(): string;
}
export declare class PriceFormatter {
    static format(amount: number): number;
}
export declare class WeightFormatter {
    static format(grams: number): number;
}
export declare class DimensionFormatter {
    static format(cm: number): number;
}
export declare function buildPaginationMeta(page: number, limit: number, total: number): {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
};
export declare function generateUnique(generator: () => string, checker: (val: string) => Promise<any>): Promise<string>;
