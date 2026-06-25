import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  role: z.enum(['BUYER', 'SELLER']).optional().default('BUYER'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const listingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  price: z.number().positive('Price must be positive').max(1000000),
  category: z.enum(['Electronics', 'Home & Garden', 'Vehicles', 'Clothing', 'Sports', 'Toys', 'Services', 'Other']),
  condition: z.enum(['New', 'Like New', 'Good', 'Fair', 'Poor']),
  location: z.string().max(200).optional().nullable(),
});

export const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const reportSchema = z.object({
  reason: z.enum(['SPAM', 'FRAUD', 'COUNTERFEIT', 'INAPPROPRIATE', 'OTHER']),
  description: z.string().min(10, 'Please provide more detail').max(1000),
  listingId: z.string().optional(),
  reportedUserId: z.string().optional(),
});

export const profileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  role: z.enum(['BUYER', 'SELLER']).optional(),
});

// Helper to validate and return error response
export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map((e) => e.message).join(', ');
    return { error: errors, data: null };
  }
  return { error: null, data: result.data };
}
