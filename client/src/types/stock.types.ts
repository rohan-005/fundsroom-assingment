export type MovementType = 'IN' | 'OUT';

export interface StockMovement {
  id: string;
  productId: string;
  quantity: number;
  movementType: MovementType;
  reason: string;
  createdById: string;
  createdAt: string;
  product?: {
    id: string;
    productName: string;
    sku: string;
    category?: string;
    currentStock: number;
  };
  createdBy?: {
    id: string;
    name: string;
    role: string;
  };
}

export interface StockFilterParams {
  productId?: string;
  movementType?: MovementType;
  page?: number;
  limit?: number;
}
