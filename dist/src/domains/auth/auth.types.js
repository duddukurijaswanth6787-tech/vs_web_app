"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeResponse = exports.UserResponse = exports.AuthTokensResponse = exports.ChangePasswordDto = exports.RefreshDto = exports.GoogleLoginDto = exports.LoginDto = exports.RegisterDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class RegisterDto {
    email;
    password;
    firstName;
    lastName;
    phone;
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'customer@vasanthidesigners.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'P@ssw0rd2026' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Vasanthi' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], RegisterDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Devi', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+919876543210', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "phone", void 0);
class LoginDto {
    email;
    username;
    password;
    rememberMe;
}
exports.LoginDto = LoginDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'customer@vasanthidesigners.com' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LoginDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'admin' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LoginDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'P@ssw0rd2026' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], LoginDto.prototype, "rememberMe", void 0);
class GoogleLoginDto {
    credential;
    rememberMe;
}
exports.GoogleLoginDto = GoogleLoginDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The signed ID token credential from Google Sign-In (GIS).' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GoogleLoginDto.prototype, "credential", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], GoogleLoginDto.prototype, "rememberMe", void 0);
class RefreshDto {
    refreshToken;
}
exports.RefreshDto = RefreshDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RefreshDto.prototype, "refreshToken", void 0);
class ChangePasswordDto {
    currentPassword;
    newPassword;
}
exports.ChangePasswordDto = ChangePasswordDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "currentPassword", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "newPassword", void 0);
class AuthTokensResponse {
    accessToken;
    refreshToken;
    expiresIn;
}
exports.AuthTokensResponse = AuthTokensResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AuthTokensResponse.prototype, "accessToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AuthTokensResponse.prototype, "refreshToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], AuthTokensResponse.prototype, "expiresIn", void 0);
class UserResponse {
    id;
    email;
    firstName;
    lastName;
    userType;
    accountStatus;
}
exports.UserResponse = UserResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UserResponse.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UserResponse.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UserResponse.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", String)
], UserResponse.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UserResponse.prototype, "userType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UserResponse.prototype, "accountStatus", void 0);
class MeResponse extends UserResponse {
    roles;
    permissions;
}
exports.MeResponse = MeResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], MeResponse.prototype, "roles", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], MeResponse.prototype, "permissions", void 0);
//# sourceMappingURL=auth.types.js.map