export declare const HEX_COLOR: RegExp;
export declare function isHexColor(value: unknown): value is string;
export declare const THEME_TOKENS: {
    readonly 'brand-primary': "#0284c7";
    readonly 'brand-primary-dark': "#0B3B78";
    readonly 'brand-on-primary': "#ffffff";
    readonly 'page-bg': "#FDFBFB";
    readonly 'announcement-bg': "#0284c7";
    readonly 'announcement-text': "#ffffff";
    readonly 'header-bg': "#ffffff";
    readonly 'header-text': "#171717";
    readonly 'header-border': "#e5e5e5";
    readonly 'hero-bg': "#EAF4FF";
    readonly 'hero-text': "#171717";
    readonly 'category-bg': "#ffffff";
    readonly 'category-text': "#171717";
    readonly 'product-card-bg': "#ffffff";
    readonly 'product-card-text': "#171717";
    readonly 'product-price': "#0284c7";
    readonly 'benefits-bg': "#EAF4FF";
    readonly 'benefits-text': "#171717";
    readonly 'testimonials-bg': "#ffffff";
    readonly 'testimonials-text': "#171717";
    readonly 'newsletter-bg': "#0A2138";
    readonly 'newsletter-text': "#ffffff";
    readonly 'footer-bg': "#0A2138";
    readonly 'footer-text': "#DCEBFA";
    readonly 'footer-heading': "#ffffff";
    readonly 'footer-link-hover': "#ffffff";
};
export type ThemeToken = keyof typeof THEME_TOKENS;
export declare const THEME_SECTIONS: {
    key: string;
    label: string;
    tokens: {
        token: ThemeToken;
        label: string;
    }[];
}[];
export declare class UpdateStorefrontThemeDto {
    colors?: Record<string, string>;
}
export declare class StorefrontThemeResponse {
    colors: Record<string, string>;
    defaults: Record<string, string>;
    sections: typeof THEME_SECTIONS;
}
