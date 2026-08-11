import { useQuery } from '@tanstack/react-query';
import { auditService } from './audit.service';
import { AuditLogQueryDto } from './audit.types';

export function useAuditLogs(query: AuditLogQueryDto) {
  return useQuery({
    queryKey: ['auditLogs', query],
    queryFn: () => auditService.getAuditLogs(query),
  });
}

export function useAuditLog(id: string) {
  return useQuery({
    queryKey: ['auditLog', id],
    queryFn: () => auditService.getAuditLogById(id),
    enabled: !!id,
  });
}

export function useAuditStats() {
  return useQuery({
    queryKey: ['auditStats'],
    queryFn: () => auditService.getAuditStats(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useEntityHistory(resource: string, resourceId: string) {
  return useQuery({
    queryKey: ['entityHistory', resource, resourceId],
    queryFn: () => auditService.getEntityHistory(resource, resourceId),
    enabled: !!resource && !!resourceId,
  });
}

export function useCompareVersions(id: string) {
  return useQuery({
    queryKey: ['compareVersions', id],
    queryFn: () => auditService.compareVersions(id),
    enabled: !!id,
  });
}
