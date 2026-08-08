export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface SalesChallanItem {
  id: string;
  challanId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  productNameSnapshot: string;
  skuSnapshot: string;
  createdAt: string;
  product?: {
    id: string;
    productName: string;
    sku: string;
    currentStock: number;
    unitPrice: number;
  };
}

export interface SalesChallan {
  id: string;
  challanNumber: string;
  customerId: string;
  totalQuantity: number;
  status: ChallanStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    businessName?: string | null;
    mobile: string;
    email?: string | null;
  };
  createdBy?: {
    id: string;
    name: string;
    role: string;
  };
  items: SalesChallanItem[];
}

export interface ChallanFilterParams {
  status?: ChallanStatus;
  customerId?: string;
  search?: string;
  page?: number;
  limit?: number;
}
