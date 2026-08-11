import { useQuery } from '@tanstack/react-query';
import { dashboardService } from './dashboard.service';

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardService.getSummary(),
  });
}

export function useDashboardSalesChart(period?: string) {
  return useQuery({
    queryKey: ['dashboard-sales-chart', period],
    queryFn: () => dashboardService.getSalesChart(period),
  });
}

export function useDashboardOrderAnalytics() {
  return useQuery({
    queryKey: ['dashboard-order-analytics'],
    queryFn: () => dashboardService.getOrderAnalytics(),
  });
}

export function useDashboardPaymentAnalytics() {
  return useQuery({
    queryKey: ['dashboard-payment-analytics'],
    queryFn: () => dashboardService.getPaymentAnalytics(),
  });
}

export function useDashboardRecentActivity() {
  return useQuery({
    queryKey: ['dashboard-recent-activity'],
    queryFn: () => dashboardService.getRecentActivity(),
  });
}
