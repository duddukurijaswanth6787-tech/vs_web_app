import { apiClient } from '@/lib/api/client';
import {
  CreateStaffDto,
  UpdateStaffDto,
  StaffQueryDto,
  StaffResponse,
} from './staff.types';
import { StandardResponse, PaginatedResponse } from '@/types/api.types';

type ApiResponse<T> = StandardResponse<T>;

export const staffService = {
  async getStaffList(query: StaffQueryDto): Promise<PaginatedResponse<StaffResponse>> {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<StaffResponse>>>('/staff', {
      params: query,
    });
    return res.data.data!;
  },

  async getStaffById(id: string): Promise<StaffResponse> {
    const res = await apiClient.get<ApiResponse<StaffResponse>>(`/staff/${id}`);
    return res.data.data!;
  },

  async createStaff(dto: CreateStaffDto): Promise<StaffResponse> {
    const res = await apiClient.post<ApiResponse<StaffResponse>>('/staff', dto);
    return res.data.data!;
  },

  async updateStaff(id: string, dto: UpdateStaffDto): Promise<StaffResponse> {
    const res = await apiClient.patch<ApiResponse<StaffResponse>>(`/staff/${id}`, dto);
    return res.data.data!;
  },

  async deleteStaff(id: string): Promise<void> {
    await apiClient.delete(`/staff/${id}`);
  },

  async restoreStaff(id: string): Promise<StaffResponse> {
    const res = await apiClient.post<ApiResponse<StaffResponse>>(`/staff/${id}/restore`);
    return res.data.data!;
  },

  async activateStaff(id: string): Promise<StaffResponse> {
    const res = await apiClient.post<ApiResponse<StaffResponse>>(`/staff/${id}/activate`);
    return res.data.data!;
  },

  async deactivateStaff(id: string): Promise<StaffResponse> {
    const res = await apiClient.post<ApiResponse<StaffResponse>>(`/staff/${id}/deactivate`);
    return res.data.data!;
  },

  async suspendStaff(id: string): Promise<StaffResponse> {
    const res = await apiClient.post<ApiResponse<StaffResponse>>(`/staff/${id}/suspend`);
    return res.data.data!;
  },

  async lockStaff(id: string): Promise<StaffResponse> {
    const res = await apiClient.post<ApiResponse<StaffResponse>>(`/staff/${id}/lock`);
    return res.data.data!;
  },

  async unlockStaff(id: string): Promise<StaffResponse> {
    const res = await apiClient.post<ApiResponse<StaffResponse>>(`/staff/${id}/unlock`);
    return res.data.data!;
  },
};
