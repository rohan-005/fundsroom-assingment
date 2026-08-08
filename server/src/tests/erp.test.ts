import request from 'supertest';
import app from '../app';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

jest.mock('../config/prisma', () => ({
  __esModule: true,
  default: require('./mockPrisma').mockPrisma,
}));

import { mockPrisma } from './mockPrisma';

describe('Mini ERP + CRM Business Flow Unit Test Suite', () => {
  let adminToken: string;
  let salesToken: string;
  let warehouseToken: string;

  beforeAll(() => {
    adminToken = jwt.sign(
      { userId: 'u-admin-1', email: 'admin@erp.com', role: 'ADMIN', name: 'Admin' },
      env.JWT_SECRET
    );
    salesToken = jwt.sign(
      { userId: 'u-sales-1', email: 'sales@erp.com', role: 'SALES', name: 'Sales' },
      env.JWT_SECRET
    );
    warehouseToken = jwt.sign(
      { userId: 'u-wh-1', email: 'warehouse@erp.com', role: 'WAREHOUSE', name: 'Warehouse' },
      env.JWT_SECRET
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma.$transaction.mockImplementation(async (cb: any) => {
      if (typeof cb === 'function') {
        return await cb(mockPrisma);
      }
      return await Promise.all(cb);
    });
  });

  describe('1. Authentication & Security Middleware', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const res = await request(app).get('/api/customers');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 when role is not authorized for endpoint', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          productName: 'Gear Unit',
          sku: 'SKU-001',
          category: 'Machinery',
          unitPrice: 100,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Customer CRM APIs', () => {
    it('GET /api/customers - returns customer list', async () => {
      mockPrisma.customer.count.mockResolvedValue(1);
      mockPrisma.customer.findMany.mockResolvedValue([
        {
          id: 'c-1',
          name: 'Apex Industries',
          mobile: '+919876543210',
          customerType: 'Wholesale',
          status: 'Active',
          createdAt: new Date(),
        },
      ]);

      const res = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${salesToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.customers).toHaveLength(1);
    });

    it('POST /api/customers - creates new customer', async () => {
      mockPrisma.customer.create.mockResolvedValue({
        id: 'c-2',
        name: 'New Client',
        mobile: '+919812345678',
        customerType: 'Retail',
        status: 'Lead',
      });

      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          name: 'New Client',
          mobile: '+919812345678',
          customerType: 'Retail',
          status: 'Lead',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('New Client');
    });
  });

  describe('3. Product Catalog & Stock Prevention', () => {
    it('POST /api/products - Warehouse creates product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      mockPrisma.product.create.mockResolvedValue({
        id: 'p-1',
        productName: 'Hydraulic Valve',
        sku: 'SKU-VLV-100',
        category: 'Hydraulics',
        unitPrice: 1200,
        currentStock: 10,
        minimumStock: 2,
      });

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send({
          productName: 'Hydraulic Valve',
          sku: 'SKU-VLV-100',
          category: 'Hydraulics',
          unitPrice: 1200,
          currentStock: 10,
          minimumStock: 2,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.sku).toBe('SKU-VLV-100');
    });

    it('POST /api/stock-movements - rejects OUT movement if currentStock < quantity', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'p-1',
        productName: 'Hydraulic Valve',
        sku: 'SKU-VLV-100',
        currentStock: 5,
      });

      const res = await request(app)
        .post('/api/stock-movements')
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send({
          productId: 'p-1',
          quantity: 20, // 20 exceeds 5
          movementType: 'OUT',
          reason: 'Manual removal',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Insufficient stock');
    });
  });

  describe('4. Sales Challan Stock Transaction & Validation', () => {
    it('POST /api/challans - creates DRAFT sales challan with snapshot fields', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue({ id: 'c-1', name: 'Apex' });
      mockPrisma.product.findMany.mockResolvedValue([
        { id: 'p-1', productName: 'Steel Bearing', sku: 'SKU-BRG-50', unitPrice: 450, currentStock: 50 },
      ]);
      mockPrisma.salesChallan.count.mockResolvedValue(0);
      mockPrisma.salesChallan.findUnique.mockResolvedValue(null);

      mockPrisma.salesChallan.create.mockResolvedValue({
        id: 'ch-1',
        challanNumber: 'CH-2026-0001',
        customerId: 'c-1',
        totalQuantity: 5,
        status: 'DRAFT',
        items: [
          {
            id: 'item-1',
            productId: 'p-1',
            quantity: 5,
            productNameSnapshot: 'Steel Bearing',
            skuSnapshot: 'SKU-BRG-50',
          },
        ],
      });

      const res = await request(app)
        .post('/api/challans')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          customerId: 'c-1',
          items: [{ productId: 'p-1', quantity: 5 }],
          status: 'DRAFT',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('DRAFT');
      expect(res.body.data.items[0].productNameSnapshot).toBe('Steel Bearing');
    });

    it('POST /api/challans/:id/confirm - rejects confirmation if stock is insufficient', async () => {
      mockPrisma.salesChallan.findUnique.mockResolvedValue({
        id: 'ch-1',
        challanNumber: 'CH-2026-0001',
        status: 'DRAFT',
        items: [
          { productId: 'p-1', quantity: 100, productNameSnapshot: 'Steel Bearing', skuSnapshot: 'SKU-BRG-50' },
        ],
      });

      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'p-1',
        productName: 'Steel Bearing',
        sku: 'SKU-BRG-50',
        currentStock: 10,
      });

      const res = await request(app)
        .post('/api/challans/ch-1/confirm')
        .set('Authorization', `Bearer ${salesToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Insufficient stock');
    });

    it('POST /api/challans/:id/confirm - confirms challan and reduces product stock in transaction', async () => {
      mockPrisma.salesChallan.findUnique.mockResolvedValue({
        id: 'ch-1',
        challanNumber: 'CH-2026-0001',
        status: 'DRAFT',
        items: [
          { productId: 'p-1', quantity: 5, productNameSnapshot: 'Steel Bearing', skuSnapshot: 'SKU-BRG-50' },
        ],
      });

      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'p-1',
        productName: 'Steel Bearing',
        sku: 'SKU-BRG-50',
        currentStock: 20,
      });

      mockPrisma.product.update.mockResolvedValue({ id: 'p-1', currentStock: 15 });
      mockPrisma.stockMovement.create.mockResolvedValue({ id: 'sm-1', movementType: 'OUT' });
      mockPrisma.salesChallan.update.mockResolvedValue({
        id: 'ch-1',
        challanNumber: 'CH-2026-0001',
        status: 'CONFIRMED',
      });

      const res = await request(app)
        .post('/api/challans/ch-1/confirm')
        .set('Authorization', `Bearer ${salesToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CONFIRMED');
      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'p-1' },
          data: { currentStock: { decrement: 5 } },
        })
      );
    });
  });
});
