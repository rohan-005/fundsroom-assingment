import { z } from 'zod';
import { ChallanStatus } from '@prisma/client';

export const challanItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  unitPrice: z.number().positive('Unit price must be greater than 0').optional(),
});

export const createChallanSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  items: z.array(challanItemSchema).min(1, 'At least one product item is required'),
  status: z.nativeEnum(ChallanStatus).default(ChallanStatus.DRAFT),
});

export const updateChallanSchema = z.object({
  status: z.nativeEnum(ChallanStatus).optional(),
  customerId: z.string().optional(),
  items: z.array(challanItemSchema).optional(),
});

export type CreateChallanInput = z.infer<typeof createChallanSchema>;
export type UpdateChallanInput = z.infer<typeof updateChallanSchema>;
export type ChallanItemInput = z.infer<typeof challanItemSchema>;
