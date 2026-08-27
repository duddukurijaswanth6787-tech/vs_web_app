export declare class CreateProfileDto {
    userId: string;
    phone?: string;
    gender?: string;
    dateOfBirth?: string;
    preferredLanguage?: string;
    preferredCurrency?: string;
    preferredCategories?: string[];
    preferredBrands?: string[];
    preferredSizes?: string[];
    preferredColors?: string[];
    preferredPriceMin?: number;
    preferredPriceMax?: number;
    profileImage?: string;
}
export declare class UpdateProfileDto {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    gender?: string;
    dateOfBirth?: string;
    preferredLanguage?: string;
    preferredCurrency?: string;
    preferredCategories?: string[];
    preferredBrands?: string[];
    preferredSizes?: string[];
    preferredColors?: string[];
    preferredPriceMin?: number;
    preferredPriceMax?: number;
    profileImage?: string;
}
export declare class ProfileResponse {
    id: string;
    userId: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    gender?: string;
    dateOfBirth?: Date;
    preferredLanguage?: string;
    preferredCurrency?: string;
    preferredCategories?: string[];
    preferredBrands?: string[];
    preferredSizes?: string[];
    preferredColors?: string[];
    preferredPriceMin?: number;
    preferredPriceMax?: number;
    profileImage?: string;
    createdAt: Date;
    updatedAt: Date;
}
