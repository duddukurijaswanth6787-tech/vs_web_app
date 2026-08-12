import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storefrontService } from './storefront.service';
import type {
  UpdateWebsiteSettingsDto,
  CreateHomepageCategoryDto,
  ReorderDto,
  BulkFeatureToggleDto,
  CreateFooterLinkDto,
  UpdateFooterLinkDto,
  UpdateSocialLinkDto,
  NewsletterQueryDto,
} from './storefront.types';

export const storefrontKeys = {
  all: ['storefront'] as const,
  settings: () => [...storefrontKeys.all, 'settings'] as const,
  homepage: () => [...storefrontKeys.all, 'homepage'] as const,
  categories: () => [...storefrontKeys.all, 'categories'] as const,
  features: () => [...storefrontKeys.all, 'features'] as const,
  footer: () => [...storefrontKeys.all, 'footer'] as const,
  social: () => [...storefrontKeys.all, 'social'] as const,
  newsletters: (q?: NewsletterQueryDto) => [...storefrontKeys.all, 'newsletters', q] as const,
  dashboard: () => [...storefrontKeys.all, 'dashboard'] as const,
};

export function useSettings() {
  return useQuery({ queryKey: storefrontKeys.settings(), queryFn: () => storefrontService.getSettings() });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateWebsiteSettingsDto) => storefrontService.updateSettings(dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: storefrontKeys.settings() }); qc.invalidateQueries({ queryKey: storefrontKeys.dashboard() }); },
  });
}

export function useHomepage() {
  return useQuery({ queryKey: storefrontKeys.homepage(), queryFn: () => storefrontService.getHomepage() });
}

export function useUpdateHomepage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sections: { key: string; data: Partial<Record<string, unknown>> }[]) => storefrontService.updateHomepage(sections),
    onSuccess: () => { qc.invalidateQueries({ queryKey: storefrontKeys.homepage() }); qc.invalidateQueries({ queryKey: storefrontKeys.dashboard() }); },
  });
}

export function useReorderHomepage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: ReorderDto) => storefrontService.reorderHomepage(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: storefrontKeys.homepage() }),
  });
}

export function useHomepageCategories() {
  return useQuery({ queryKey: storefrontKeys.categories(), queryFn: () => storefrontService.getHomepageCategories() });
}

export function useAddHomepageCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateHomepageCategoryDto) => storefrontService.addHomepageCategory(dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: storefrontKeys.categories() }); qc.invalidateQueries({ queryKey: storefrontKeys.dashboard() }); },
  });
}

export function useRemoveHomepageCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => storefrontService.removeHomepageCategory(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: storefrontKeys.categories() }); qc.invalidateQueries({ queryKey: storefrontKeys.dashboard() }); },
  });
}

export function useReorderHomepageCategories() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: ReorderDto) => storefrontService.reorderHomepageCategories(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: storefrontKeys.categories() }),
  });
}

export function useFeatures() {
  return useQuery({ queryKey: storefrontKeys.features(), queryFn: () => storefrontService.getFeatures() });
}

export function useUpdateFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) => storefrontService.updateFeature(key, enabled),
    onSuccess: () => { qc.invalidateQueries({ queryKey: storefrontKeys.features() }); qc.invalidateQueries({ queryKey: storefrontKeys.dashboard() }); },
  });
}

export function useBulkUpdateFeatures() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: BulkFeatureToggleDto) => storefrontService.bulkUpdateFeatures(dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: storefrontKeys.features() }); qc.invalidateQueries({ queryKey: storefrontKeys.dashboard() }); },
  });
}

export function useFooter() {
  return useQuery({ queryKey: storefrontKeys.footer(), queryFn: () => storefrontService.getFooter() });
}

export function useAddFooterLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateFooterLinkDto) => storefrontService.addFooterLink(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: storefrontKeys.footer() }),
  });
}

export function useUpdateFooterLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateFooterLinkDto }) => storefrontService.updateFooterLink(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: storefrontKeys.footer() }),
  });
}

export function useDeleteFooterLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => storefrontService.deleteFooterLink(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: storefrontKeys.footer() }); qc.invalidateQueries({ queryKey: storefrontKeys.dashboard() }); },
  });
}

export function useSocialLinks() {
  return useQuery({ queryKey: storefrontKeys.social(), queryFn: () => storefrontService.getSocialLinks() });
}

export function useUpdateSocialLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ platform, dto }: { platform: string; dto: UpdateSocialLinkDto }) => storefrontService.updateSocialLink(platform, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: storefrontKeys.social() }); qc.invalidateQueries({ queryKey: storefrontKeys.dashboard() }); },
  });
}

export function useNewsletters(query: NewsletterQueryDto = {}) {
  return useQuery({ queryKey: storefrontKeys.newsletters(query), queryFn: () => storefrontService.getNewsletters(query) });
}

export function useRemoveNewsletter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => storefrontService.removeNewsletter(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...storefrontKeys.all, 'newsletters'] }),
  });
}

export function useDashboard() {
  return useQuery({ queryKey: storefrontKeys.dashboard(), queryFn: () => storefrontService.getDashboard(), staleTime: 30_000 });
}
