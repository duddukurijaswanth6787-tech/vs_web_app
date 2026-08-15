import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from './category.service';
import { CategoryQueryDto, CreateCategoryDto, UpdateCategoryDto, MoveCategoryDto, ReorderCategoriesDto, CategoryResponse } from './category.types';

// Build a nested tree from a flat category list, used as a fallback when the
// dedicated /categories/tree endpoint returns empty (which was leaving the
// admin's tree UI empty even when the DB had rows the storefront could see).
function buildTreeFromFlat(list: CategoryResponse[]): CategoryResponse[] {
  const map = new Map<string, CategoryResponse & { children: CategoryResponse[] }>();
  const roots: (CategoryResponse & { children: CategoryResponse[] })[] = [];
  for (const cat of list) {
    map.set(cat.id, { ...cat, children: [] });
  }
  for (const cat of list) {
    const node = map.get(cat.id)!;
    const parentId = (cat as unknown as { parentId?: string }).parentId;
    if (parentId && map.has(parentId)) {
      map.get(parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

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
    queryFn: async () => {
      try {
        const tree = await categoryService.getTree();
        if (Array.isArray(tree) && tree.length > 0) {
          return tree;
        }
      } catch {
        // fall through — try the flat endpoint before giving up
      }
      // Fallback: fetch all categories as a flat list and build the tree
      // client-side. Keeps admin's view honest when /categories/tree is empty
      // or misbehaving, so admin always sees whatever's really in the DB.
      const flat = await categoryService.findAll({ page: 1, limit: 500 });
      return buildTreeFromFlat(flat.data || []);
    },
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
