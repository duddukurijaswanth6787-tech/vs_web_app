"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsEmailCustom = IsEmailCustom;
exports.IsPhoneNumberCustom = IsPhoneNumberCustom;
exports.IsPasswordCustom = IsPasswordCustom;
exports.IsUsernameCustom = IsUsernameCustom;
exports.IsUUIDCustom = IsUUIDCustom;
exports.IsSlugCustom = IsSlugCustom;
exports.IsNameCustom = IsNameCustom;
exports.IsPriceCustom = IsPriceCustom;
exports.IsQuantityCustom = IsQuantityCustom;
exports.IsPercentageCustom = IsPercentageCustom;
exports.IsGSTCustom = IsGSTCustom;
exports.IsDiscountCustom = IsDiscountCustom;
exports.IsCurrencyCustom = IsCurrencyCustom;
exports.IsDateCustom = IsDateCustom;
exports.IsTimeCustom = IsTimeCustom;
exports.IsDateTimeCustom = IsDateTimeCustom;
exports.IsURLCustom = IsURLCustom;
exports.IsFileNameCustom = IsFileNameCustom;
exports.IsImageCustom = IsImageCustom;
exports.IsVideoCustom = IsVideoCustom;
exports.IsDocumentCustom = IsDocumentCustom;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
function IsEmailCustom(validationOptions) {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiProperty)({
        description: 'Secure email address',
        format: 'email',
        example: 'customer@vasanthidesigners.com',
    }), (target, propertyKey) => {
        (0, class_validator_1.registerDecorator)({
            name: 'isEmailCustom',
            target: target.constructor,
            propertyName: propertyKey,
            options: validationOptions,
            validator: {
                validate(value) {
                    return (typeof value === 'string' &&
                        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value));
                },
                defaultMessage(args) {
                    return `${args.property} must be a valid email format`;
                },
            },
        });
    });
}
function IsPhoneNumberCustom(validationOptions) {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiProperty)({
        description: 'Contact phone number (Indian or International)',
        example: '+919876543210',
    }), (target, propertyKey) => {
        (0, class_validator_1.registerDecorator)({
            name: 'isPhoneNumberCustom',
            target: target.constructor,
            propertyName: propertyKey,
            options: validationOptions,
            validator: {
                validate(value) {
                    return (typeof value === 'string' &&
                        /^(?:\+91|91)?[6789]\d{9}$|^[+]?[1-9]\d{1,14}$/.test(value));
                },
                defaultMessage(args) {
                    return `${args.property} must be a valid 10-digit Indian number or international format`;
                },
            },
        });
    });
}
function IsPasswordCustom(validationOptions) {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiProperty)({
        description: 'Secure user password containing upper, lower, numeric, and special chars',
        format: 'password',
        example: 'P@ssw0rd2026',
    }), (target, propertyKey) => {
        (0, class_validator_1.registerDecorator)({
            name: 'isPasswordCustom',
            target: target.constructor,
            propertyName: propertyKey,
            options: validationOptions,
            validator: {
                validate(value) {
                    return (typeof value === 'string' &&
                        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/.test(value));
                },
                defaultMessage(args) {
                    return `${args.property} must be at least 8 characters long and contain uppercase, lowercase, numeric, and special characters`;
                },
            },
        });
    });
}
function IsUsernameCustom(validationOptions) {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiProperty)({
        description: 'Alphanumeric profile username',
        minLength: 3,
        maxLength: 20,
        example: 'vasanthi_admin',
    }), (target, propertyKey) => {
        (0, class_validator_1.registerDecorator)({
            name: 'isUsernameCustom',
            target: target.constructor,
            propertyName: propertyKey,
            options: validationOptions,
            validator: {
                validate(value) {
                    return (typeof value === 'string' && /^[a-zA-Z0-9_-]{3,20}$/.test(value));
                },
                defaultMessage(args) {
                    return `${args.property} must be an alphanumeric string between 3 and 20 characters`;
                },
            },
        });
    });
}
function IsUUIDCustom(validationOptions) {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiProperty)({
        description: 'UUID Version 4 identifier',
        format: 'uuid',
        example: 'f3a466d3-2be2-4467-93aa-bf2a9d8bb1d7',
    }), (target, propertyKey) => {
        (0, class_validator_1.registerDecorator)({
            name: 'isUUIDCustom',
            target: target.constructor,
            propertyName: propertyKey,
            options: validationOptions,
            validator: {
                validate(value) {
                    return (typeof value === 'string' &&
                        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
                },
                defaultMessage(args) {
                    return `${args.property} must be a valid UUID v4`;
                },
            },
        });
    });
}
function IsSlugCustom(validationOptions) {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiProperty)({
        description: 'URL-friendly product or category slug',
        pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
        example: 'designer-silk-saree',
    }), (target, propertyKey) => {
        (0, class_validator_1.registerDecorator)({
            name: 'isSlugCustom',
            target: target.constructor,
            propertyName: propertyKey,
            options: validationOptions,
            validator: {
                validate(value) {
                    return (typeof value === 'string' &&
                        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value));
                },
                defaultMessage(args) {
                    return `${args.property} must be a lowercase URL slug`;
                },
            },
        });
    });
}
function IsNameCustom(validationOptions) {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiProperty)({
        description: 'Standard user name',
        example: 'Vasanthi Devi',
    }), (target, propertyKey) => {
        (0, class_validator_1.registerDecorator)({
            name: 'isNameCustom',
            target: target.constructor,
            propertyName: propertyKey,
            options: validationOptions,
            validator: {
                validate(value) {
                    return (typeof value === 'string' && /^[a-zA-Z\s]{2,50}$/.test(value));
                },
                defaultMessage(args) {
                    return `${args.property} must contain only alphabetical characters and be between 2 and 50 characters long`;
                },
            },
        });
    });
}
function IsPriceCustom(validationOptions) {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiProperty)({
        description: 'Decimal product price value',
        minimum: 0.01,
        example: 2499.5,
    }), (target, propertyKey) => {
        (0, class_validator_1.registerDecorator)({
            name: 'isPriceCustom',
            target: target.constructor,
            propertyName: propertyKey,
            options: validationOptions,
            validator: {
                validate(value) {
                    return ((typeof value === 'number' || !isNaN(Number(value))) &&
                        Number(value) > 0 &&
                        /^\d+(?:\.\d{1,2})?$/.test(String(value)));
                },
                defaultMessage(args) {
                    return `${args.property} must be a positive number with at most 2 decimal places`;
                },
            },
        });
    });
}
function IsQuantityCustom(validationOptions) {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiProperty)({
        description: 'Integer stock count/quantity',
        minimum: 0,
        example: 50,
    }), (target, propertyKey) => {
        (0, class_validator_1.registerDecorator)({
            name: 'isQuantityCustom',
            target: target.constructor,
            propertyName: propertyKey,
            options: validationOptions,
            validator: {
                validate(value) {
                    return Number.isInteger(Number(value)) && Number(value) >= 0;
                },
                defaultMessage(args) {
                    return `${args.property} must be a non-negative integer`;
                },
            },
        });
    });
}
function IsPercentageCustom(validationOptions) {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiProperty)({
        description: 'Float percentage value (0-100)',
        minimum: 0,
        maximum: 100,
        example: 18.0,
    }), (target, propertyKey) => {
        (0, class_validator_1.registerDecorator)({
            name: 'isPercentageCustom',
            target: target.constructor,
            propertyName: propertyKey,
            options: validationOptions,
            validator: {
                validate(value) {
                    const num = Number(value);
                    return !isNaN(num) && num >= 0 && num <= 100;
                },
                defaultMessage(args) {
                    return `${args.property} must be a percentage value between 0 and 100`;
                },
            },
        });
    });
}
function IsGSTCustom(validationOptions) {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiProperty)({
        description: '15-digit Indian GSTIN tax registration code',
        example: '33AABCV1234F1Z5',
    }), (target, propertyKey) => {
        (0, class_validator_1.registerDecorator)({
            name: 'isGSTCustom',
            target: target.constructor,
            propertyName: propertyKey,
            options: validationOptions,
            validator: {
                validate(value) {
                    return (typeof value === 'string' &&
                        /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/.test(value));
                },
                defaultMessage(args) {
                    return `${args.property} must be a valid 15-character Indian GSTIN registration number`;
                },
            },
        });
    });
}
function IsDiscountCustom(validationOptions) {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiProperty)({
        description: 'Discount pricing deduction value',
        minimum: 0,
        example: 500.0,
    }), (target, propertyKey) => {
        (0, class_validator_1.registerDecorator)({
            name: 'isDiscountCustom',
            target: target.constructor,
            propertyName: propertyKey,
            options: validationOptions,
            validator: {
                validate(value) {
                    const num = Number(value);
                    return !isNaN(num) && num >= 0;
                },
                defaultMessage(args) {
                    return `${args.property} must be a positive discount amount`;
                },
            },
        });
    });
}
function IsCurrencyCustom(validationOptions) {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiProperty)({
        description: '3-character ISO currency code',
        example: 'INR',
    }), (target, propertyKey) => {
        (0, class_validator_1.registerDecorator)({
            name: 'isCurrencyCustom',
            target: target.constructor,
            propertyName: propertyKey,
            options: validationOptions,
            validator: {
                validate(value) {
                    return typeof value === 'string' && /^[A-Z]{3}$/.test(value);
                },
                defaultMessage(args) {
                    return `${args.property} must be a valid 3-letter currency code (e.g. INR)`;
                },
            },
        });
    });
}
function IsDateCustom(validationOptions) {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiProperty)({
        description: 'ISO format date string (YYYY-MM-DD)',
        example: '2026-07-09',
    }), (target, propertyKey) => {
        (0, class_validator_1.registerDecorator)({
            name: 'isDateCustom',
            target: target.constructor,
            propertyName: propertyKey,
            options: validationOptions,
            validator: {
                validate(value) {
                    return (typeof value === 'string' &&
                        /^\d{4}-\d{2}-\d{2}$/.test(value) &&
                        !isNaN(Date.parse(value)));
                },
                defaultMessage(args) {
                    return `${args.property} must be a valid ISO date string (YYYY-MM-DD)`;
                },
            },
        });
    });
}
function IsTimeCustom(validationOptions) {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiProperty)({
        description: '24-hour format time string (HH:MM:SS)',
        example: '14:30:00',
    }), (target, propertyKey) => {
        (0, class_validator_1.registerDecorator)({
            name: 'isTimeCustom',
            target: target.constructor,
            propertyName: propertyKey,
            options: validationOptions,
            validator: {
                validate(value) {
                    return (typeof value === 'string' &&
                        /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value));
                },
                defaultMessage(args) {
                    return `${args.property} must be a valid 24-hour time format (HH:MM:SS)`;
                },
            },
        });
    });
}
function IsDateTimeCustom(validationOptions) {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiProperty)({
        description: 'ISO format datetime timestamp',
        example: '2026-07-09T14:30:00.000Z',
    }), (target, propertyKey) => {
        (0, class_validator_1.registerDecorator)({
            name: 'isDateTimeCustom',
            target: target.constructor,
            propertyName: propertyKey,
            options: validationOptions,
            validator: {
                validate(value) {
                    return typeof value === 'string' && !isNaN(Date.parse(value));
                },
                defaultMessage(args) {
                    return `${args.property} must be a valid ISO datetime format`;
                },
            },
        });
    });
}
function IsURLCustom(validationOptions) {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiProperty)({
        description: 'Web URL address link',
        example: 'https://vasanthidesigners.com',
    }), (target, propertyKey) => {
        (0, class_validator_1.registerDecorator)({
            name: 'isURLCustom',
            target: target.constructor,
            propertyName: propertyKey,
            options: validationOptions,
            validator: {
                validate(value) {
                    return (typeof value === 'string' &&
                        /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(value));
                },
                defaultMessage(args) {
                    return `${args.property} must be a valid URL`;
                },
            },
        });
    });
}
function IsFileNameCustom(validationOptions) {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiProperty)({
        description: 'Secure filename (lowercase alphanumeric, dots, and hyphens)',
        example: 'saree_image.png',
    }), (target, propertyKey) => {
        (0, class_validator_1.registerDecorator)({
            name: 'isFileNameCustom',
            target: target.constructor,
            propertyName: propertyKey,
            options: validationOptions,
            validator: {
                validate(value) {
                    return (typeof value === 'string' &&
                        /^[a-zA-Z0-9_\-.]+$/.test(value) &&
                        !value.includes('..'));
                },
                defaultMessage(args) {
                    return `${args.property} must be a secure filename containing only alphanumeric characters, underscores, hyphens, and dots`;
                },
            },
        });
    });
}
function IsImageCustom(validationOptions) {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiProperty)({
        description: 'Path or name of an image file (.jpg, .png, .webp)',
        example: 'banner.webp',
    }), (target, propertyKey) => {
        (0, class_validator_1.registerDecorator)({
            name: 'isImageCustom',
            target: target.constructor,
            propertyName: propertyKey,
            options: validationOptions,
            validator: {
                validate(value) {
                    return (typeof value === 'string' &&
                        /\.(jpe?g|png|webp|gif)$/i.test(value));
                },
                defaultMessage(args) {
                    return `${args.property} must be a valid image file type (.jpg, .jpeg, .png, .webp, .gif)`;
                },
            },
        });
    });
}
function IsVideoCustom(validationOptions) {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiProperty)({
        description: 'Path or name of a video file (.mp4, .mov, .webm)',
        example: 'ad_clip.mp4',
    }), (target, propertyKey) => {
        (0, class_validator_1.registerDecorator)({
            name: 'isVideoCustom',
            target: target.constructor,
            propertyName: propertyKey,
            options: validationOptions,
            validator: {
                validate(value) {
                    return (typeof value === 'string' && /\.(mp4|mov|webm|mkv)$/i.test(value));
                },
                defaultMessage(args) {
                    return `${args.property} must be a valid video file type (.mp4, .mov, .webm, .mkv)`;
                },
            },
        });
    });
}
function IsDocumentCustom(validationOptions) {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiProperty)({
        description: 'Path or name of a document file (.pdf, .xlsx, .csv)',
        example: 'invoice.pdf',
    }), (target, propertyKey) => {
        (0, class_validator_1.registerDecorator)({
            name: 'isDocumentCustom',
            target: target.constructor,
            propertyName: propertyKey,
            options: validationOptions,
            validator: {
                validate(value) {
                    return (typeof value === 'string' &&
                        /\.(pdf|xlsx?|csv|docx?)$/i.test(value));
                },
                defaultMessage(args) {
                    return `${args.property} must be a valid document file type (.pdf, .xls, .xlsx, .csv, .doc, .docx)`;
                },
            },
        });
    });
}
//# sourceMappingURL=decorators.validation.js.map