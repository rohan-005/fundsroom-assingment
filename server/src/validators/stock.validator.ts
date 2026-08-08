import { z } from 'zod';

export const createStockMovementSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  movementType: z.enum(['IN', 'OUT']),
  reason: z.string().min(2, 'Reason is required'),
});

export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;
