import { CustomerProfileService } from './customer-profile.service';
import { UpdateProfileDto } from './customer-profile.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class CustomerProfileController {
    private readonly profileService;
    constructor(profileService: CustomerProfileService);
    getProfile(user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./customer-profile.types").ProfileResponse>>;
    updateProfile(dto: UpdateProfileDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./customer-profile.types").ProfileResponse>>;
    adminGetProfile(userId: string): Promise<import("@common/responses/response.builder").ResponsePayload<import("./customer-profile.types").ProfileResponse>>;
    adminUpdateProfile(userId: string, dto: UpdateProfileDto): Promise<import("@common/responses/response.builder").ResponsePayload<import("./customer-profile.types").ProfileResponse>>;
}
