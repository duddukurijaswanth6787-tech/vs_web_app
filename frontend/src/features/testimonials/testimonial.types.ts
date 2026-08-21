export interface Testimonial {
  id: string;
  name: string;
  role?: string;
  comment: string;
  rating: number;
  avatarUrl?: string;
  location?: string;
  isFeatured: boolean;
  displayOrder: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface CreateTestimonialInput {
  name: string;
  role?: string;
  comment: string;
  rating?: number;
  avatarUrl?: string;
  location?: string;
  isFeatured?: boolean;
  displayOrder?: number;
}

export interface UpdateTestimonialInput extends Partial<CreateTestimonialInput> {
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}
