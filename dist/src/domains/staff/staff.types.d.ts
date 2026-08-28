import { StaffDepartment, StaffDesignation } from "../../shared/identity/identity.enums";
export declare class CreateStaffDto {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
    phone?: string;
    department: StaffDepartment;
    designation: StaffDesignation;
    employeeId?: string;
    roleId?: string;
    jobTitle?: string;
    reportingManagerId?: string;
    emergencyContact?: string;
    address?: string;
}
export declare class UpdateStaffDto {
    firstName?: string;
    lastName?: string;
    phone?: string;
    department?: StaffDepartment;
    designation?: StaffDesignation;
    jobTitle?: string;
    reportingManagerId?: string;
    emergencyContact?: string;
    address?: string;
    profileImage?: string;
}
export declare class StaffQueryDto {
    search?: string;
    department?: StaffDepartment;
    designation?: StaffDesignation;
    employmentStatus?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export declare class StaffResponse {
    id: string;
    userId: string;
    email: string;
    firstName: string;
    lastName?: string;
    department: string;
    designation: string;
    employeeId: string;
    jobTitle?: string;
    reportingManagerId?: string;
    employmentStatus: string;
    accountStatus: string;
    joinedAt?: Date;
    phone?: string;
    profileImage?: string;
    createdAt: Date;
}
