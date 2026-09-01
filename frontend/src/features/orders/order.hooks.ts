import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from './order.service';
import { OrderQueryDto } from './order.types';
import { inventoryKeys } from '../inventory/inventory.hooks';

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (query: OrderQueryDto) => [...orderKeys.lists(), query] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  detailByNumber: (orderNumber: string) => [...orderKeys.details(), 'number', orderNumber] as const,
};

export function useOrderList(query: OrderQueryDto = {}) {
  return useQuery({
    queryKey: orderKeys.list(query),
    queryFn: () => orderService.findAll(query),
  });
}

export function useOrderDetail(id: string, enabled = true) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => orderService.findById(id),
    enabled: !!id && enabled,
  });
}

export function useOrderDetailByNumber(orderNumber: string, enabled = true) {
  return useQuery({
    queryKey: orderKeys.detailByNumber(orderNumber),
    queryFn: () => orderService.findByOrderNumber(orderNumber),
    enabled: !!orderNumber && enabled,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, message }: { id: string; status: string; message?: string }) =>
      orderService.updateStatus(id, status, message),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.detailByNumber(data.orderNumber) });
      // Invalidate inventory since order status changes may affect reservations/deductions
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function useAssignCourier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: import('./order.types').AssignCourierDto }) =>
      orderService.assignCourier(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.detailByNumber(data.orderNumber) });
    },
  });
}
