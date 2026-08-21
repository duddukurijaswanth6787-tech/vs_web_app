import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { testimonialService } from './testimonial.service';
import { CreateTestimonialInput, UpdateTestimonialInput } from './testimonial.types';

export const testimonialKeys = {
  all: ['testimonials'] as const,
  featured: () => [...testimonialKeys.all, 'featured'] as const,
  list: () => [...testimonialKeys.all, 'list'] as const,
  detail: (id: string) => [...testimonialKeys.all, 'detail', id] as const,
};

export function useFeaturedTestimonials() {
  return useQuery({
    queryKey: testimonialKeys.featured(),
    queryFn: () => testimonialService.getFeatured(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllTestimonials() {
  return useQuery({
    queryKey: testimonialKeys.list(),
    queryFn: () => testimonialService.getAll(),
  });
}

export function useCreateTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTestimonialInput) => testimonialService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testimonialKeys.all });
    },
  });
}

export function useUpdateTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTestimonialInput }) =>
      testimonialService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testimonialKeys.all });
    },
  });
}

export function useDeleteTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => testimonialService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testimonialKeys.all });
    },
  });
}
