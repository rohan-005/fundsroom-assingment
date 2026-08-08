export const mockPrisma: any = {
  user: { findUnique: jest.fn(), upsert: jest.fn() },
  customer: { findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  product: { findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  stockMovement: { findMany: jest.fn(), count: jest.fn(), create: jest.fn(), createMany: jest.fn() },
  salesChallan: { findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  salesChallanItem: { deleteMany: jest.fn() },
  followUp: { create: jest.fn() },
  $transaction: jest.fn(async (cb: any) => {
    if (typeof cb === 'function') {
      return await cb(mockPrisma);
    }
    return await Promise.all(cb);
  }),
  $disconnect: jest.fn(),
};
