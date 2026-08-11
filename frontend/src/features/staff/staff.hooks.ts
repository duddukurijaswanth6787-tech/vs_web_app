import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffService } from './staff.service';
import { StaffQueryDto, CreateStaffDto, UpdateStaffDto } from './staff.types';

export function useStaffList(query: StaffQueryDto) {
  return useQuery({
    queryKey: ['staffList', query],
    queryFn: () => staffService.getStaffList(query),
  });
}

export function useStaff(id: string) {
  return useQuery({
    queryKey: ['staffMember', id],
    queryFn: () => staffService.getStaffById(id),
    enabled: !!id,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateStaffDto) => staffService.createStaff(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffList'] });
    },
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateStaffDto }) =>
      staffService.updateStaff(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staffMember', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['staffList'] });
    },
  });
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffService.deleteStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffList'] });
    },
  });
}

export function useActivateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffService.activateStaff(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['staffMember', id] });
      queryClient.invalidateQueries({ queryKey: ['staffList'] });
    },
  });
}

export function useDeactivateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffService.deactivateStaff(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['staffMember', id] });
      queryClient.invalidateQueries({ queryKey: ['staffList'] });
    },
  });
}

export function useSuspendStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffService.suspendStaff(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['staffMember', id] });
      queryClient.invalidateQueries({ queryKey: ['staffList'] });
    },
  });
}

export function useLockStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffService.lockStaff(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['staffMember', id] });
      queryClient.invalidateQueries({ queryKey: ['staffList'] });
    },
  });
}

export function useUnlockStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffService.unlockStaff(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['staffMember', id] });
      queryClient.invalidateQueries({ queryKey: ['staffList'] });
    },
  });
}
