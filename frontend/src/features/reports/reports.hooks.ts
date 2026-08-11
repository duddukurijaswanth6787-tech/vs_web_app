import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsService } from './reports.service';
import { GenerateReportDto } from './reports.types';

export function useSalesReport(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['sales-report', startDate, endDate],
    queryFn: () => reportsService.getSalesReport(startDate, endDate),
  });
}

export function useInventoryReport() {
  return useQuery({
    queryKey: ['inventory-report'],
    queryFn: () => reportsService.getInventoryReport(),
  });
}

export function useCustomerReport() {
  return useQuery({
    queryKey: ['customer-report'],
    queryFn: () => reportsService.getCustomerReport(),
  });
}

export function useOrderReport(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['order-report', startDate, endDate],
    queryFn: () => reportsService.getOrderReport(startDate, endDate),
  });
}

export function useListReport(type: string, startDate?: string, endDate?: string, page = 1) {
  return useQuery({
    queryKey: ['list-report', type, startDate, endDate, page],
    queryFn: () => reportsService.getListReport(type, startDate, endDate, page),
  });
}

export function useCreateExportJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: GenerateReportDto) => reportsService.createExportJob(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['export-jobs'] });
    },
  });
}

export function useExportJobs(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['export-jobs', page, limit],
    queryFn: () => reportsService.getExportJobs(page, limit),
  });
}

export function useExportJobDownloadUrl(id: string, enabled = false) {
  return useQuery({
    queryKey: ['export-download-url', id],
    queryFn: () => reportsService.getExportJobDownloadUrl(id),
    enabled: enabled && !!id,
  });
}
