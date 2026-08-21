import { apiClient } from '@/lib/api/client';
import { Testimonial, CreateTestimonialInput, UpdateTestimonialInput } from './testimonial.types';

export const testimonialService = {
  getFeatured: async (): Promise<Testimonial[]> => {
    const res = await apiClient.get<{ data: Testimonial[] }>('/testimonials/featured');
    return res.data?.data || (res.data as unknown as Testimonial[]) || [];
  },

  getAll: async (): Promise<Testimonial[]> => {
    const res = await apiClient.get<{ data: Testimonial[] }>('/testimonials');
    return res.data?.data || (res.data as unknown as Testimonial[]) || [];
  },

  getById: async (id: string): Promise<Testimonial> => {
    const res = await apiClient.get<{ data: Testimonial }>(`/testimonials/${id}`);
    return res.data?.data || (res.data as unknown as Testimonial);
  },

  create: async (input: CreateTestimonialInput): Promise<Testimonial> => {
    const res = await apiClient.post<{ data: Testimonial }>('/testimonials', input);
    return res.data?.data || (res.data as unknown as Testimonial);
  },

  update: async (id: string, input: UpdateTestimonialInput): Promise<Testimonial> => {
    const res = await apiClient.patch<{ data: Testimonial }>(`/testimonials/${id}`, input);
    return res.data?.data || (res.data as unknown as Testimonial);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/testimonials/${id}`);
  },
};
