import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from './category.service';
import { CategoryQueryDto, CreateCategoryDto, UpdateCategoryDto, MoveCategoryDto, ReorderCategoriesDto } from './category.types';

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (query: CategoryQueryDto) => [...categoryKeys.lists(), query] as const,
  tree: () => [...categoryKeys.all, 'tree'] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
};

export function useCategories(query: CategoryQueryDto = {}) {
  return useQuery({
    queryKey: categoryKeys.list(query),
    queryFn: () => categoryService.findAll(query),
  });
}

export function useCategoryTree() {
  return useQuery({
    queryKey: categoryKeys.tree(),
    queryFn: () => categoryService.getTree(),
  });
}

export function useCategory(id: string, enabled = true) {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => categoryService.findById(id),
    enabled: !!id && enabled,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCategoryDto) => categoryService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCategoryDto }) =>
      categoryService.update(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(data.id) });
    },
  });
}

export function useMoveCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: MoveCategoryDto }) =>
      categoryService.move(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(data.id) });
    },
  });
}

export function useReorderCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: ReorderCategoriesDto) => categoryService.reorder(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoryService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(id) });
    },
  });
}

export function useRestoreCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoryService.restore(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(data.id) });
    },
  });
}
