import prisma from '../config/prisma';
import { CreateProductInput, UpdateProductInput } from '../validators/product.validator';
import { AppError } from '../utils/appError';
import { Prisma } from '@prisma/client';

export class ProductService {
  static async getAll(query: {
    search?: string;
    category?: string;
    lowStock?: boolean | string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    if (query.category) {
      where.category = { equals: query.category, mode: 'insensitive' };
    }

    if (query.search) {
      const searchLower = query.search.trim();
      where.OR = [
        { productName: { contains: searchLower, mode: 'insensitive' } },
        { sku: { contains: searchLower, mode: 'insensitive' } },
        { category: { contains: searchLower, mode: 'insensitive' } },
        { warehouseLocation: { contains: searchLower, mode: 'insensitive' } },
      ];
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    let resultProducts = products;
    if (query.lowStock === true || query.lowStock === 'true') {
      resultProducts = products.filter((p) => p.currentStock <= p.minimumStock);
    }

    return {
      products: resultProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            createdBy: { select: { id: true, name: true, role: true } },
          },
        },
      },
    });

    if (!product) {
      throw new AppError(404, 'Product not found');
    }

    return product;
  }

  static async create(data: CreateProductInput) {
    const existingSku = await prisma.product.findUnique({
      where: { sku: data.sku.toUpperCase() },
    });

    if (existingSku) {
      throw new AppError(400, `Product with SKU '${data.sku.toUpperCase()}' already exists`);
    }

    return prisma.product.create({
      data: {
        ...data,
        sku: data.sku.toUpperCase(),
        warehouseLocation: data.warehouseLocation || null,
      },
    });
  }

  static async update(id: string, data: UpdateProductInput) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(404, 'Product not found');
    }

    if (data.sku && data.sku.toUpperCase() !== existing.sku) {
      const skuCheck = await prisma.product.findUnique({
        where: { sku: data.sku.toUpperCase() },
      });
      if (skuCheck) {
        throw new AppError(400, `Product with SKU '${data.sku.toUpperCase()}' already exists`);
      }
    }

    return prisma.product.update({
      where: { id },
      data: {
        ...data,
        ...(data.sku ? { sku: data.sku.toUpperCase() } : {}),
      },
    });
  }
}
