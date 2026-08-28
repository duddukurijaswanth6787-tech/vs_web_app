import { LoggerService } from "../../common/logger/logger.service";
import { PasswordService } from "../auth/services/password.service";
import { UsersRepository } from './users.repository';
import { CreateUserDto, UpdateUserDto, AssignRoleDto, UserQueryDto, UserDetailResponse } from './users.types';
export declare class UsersService {
    private readonly usersRepository;
    private readonly passwordService;
    private readonly loggerService;
    constructor(usersRepository: UsersRepository, passwordService: PasswordService, loggerService: LoggerService);
    findAll(query: UserQueryDto): Promise<{
        data: {
            id: string;
            createdAt: Date;
            email: string;
            userType: import(".prisma/client").$Enums.UserType;
            accountStatus: import(".prisma/client").$Enums.AccountStatus;
            firstName: string;
            lastName: string | null;
            lastLoginAt: Date | null;
            isEmailVerified: boolean;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findById(id: string): Promise<UserDetailResponse>;
    create(dto: CreateUserDto): Promise<UserDetailResponse>;
    update(id: string, dto: UpdateUserDto): Promise<UserDetailResponse>;
    delete(id: string): Promise<void>;
    restore(id: string): Promise<UserDetailResponse>;
    private updateSimple;
    activate(id: string): Promise<UserDetailResponse>;
    deactivate(id: string): Promise<UserDetailResponse>;
    suspend(id: string): Promise<UserDetailResponse>;
    unlock(id: string): Promise<UserDetailResponse>;
    assignRole(id: string, dto: AssignRoleDto): Promise<UserDetailResponse>;
    removeRole(id: string, roleId: string): Promise<UserDetailResponse>;
    getRoles(id: string): Promise<{
        id: string;
        name: string;
        displayName: string;
    }[]>;
    getPermissions(id: string): Promise<{
        code: string;
        name: string;
        module: string;
    }[]>;
}
