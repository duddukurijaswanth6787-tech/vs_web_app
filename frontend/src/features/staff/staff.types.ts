export type StaffDepartment =
  | 'MANAGEMENT'
  | 'SALES'
  | 'MARKETING'
  | 'WAREHOUSE'
  | 'PACKING'
  | 'CUSTOMER_SUPPORT'
  | 'INVENTORY'
  | 'ACCOUNTING'
  | 'IT';

export type StaffDesignation =
  | 'MANAGER'
  | 'SUPERVISOR'
  | 'EXECUTIVE'
  | 'ASSOCIATE'
  | 'TRAINEE';

export interface CreateStaffDto {
  email: string;
  password?: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  department: StaffDepartment;
  designation: StaffDesignation;
  /** Omit to have the backend auto-generate one (EMP-0001, EMP-0002, …). */
  employeeId?: string;
  jobTitle?: string;
  reportingManagerId?: string;
  emergencyContact?: string;
  address?: string;
}

export interface UpdateStaffDto {
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

export interface StaffQueryDto {
  search?: string;
  department?: StaffDepartment;
  designation?: StaffDesignation;
  employmentStatus?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface StaffResponse {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName?: string;
  department: StaffDepartment;
  designation: StaffDesignation;
  employeeId: string;
  jobTitle?: string;
  reportingManagerId?: string;
  employmentStatus: string;
  accountStatus: string;
  joinedAt?: string;
  phone?: string;
  profileImage?: string;
  createdAt: string;
}
