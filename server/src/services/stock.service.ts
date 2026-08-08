import prisma from '../config/prisma';
import { CreateStockMovementInput } from '../validators/stock.validator';
import { MovementType } from '@prisma/client';

export class StockService {
  static async getAll(query: {
    productId?: string;
    movementType?: MovementType;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.productId) {
      where.productId = query.productId;
    }

    if (query.movementType) {
      where.movementType = query.movementType;
    }

    const [total, movements] = await Promise.all([
      prisma.stockMovement.count({ where }),
      prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, productName: true, sku: true, category: true, currentStock: true },
          },
          createdBy: {
            select: { id: true, name: true, role: true },
          },
        },
      }),
    ]);

    return {
      movements,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async create(userId: string, data: CreateStockMovementInput) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: data.productId },
      });

      if (!product) {
        throw { statusCode: 404, message: 'Product not found' };
      }

      if (data.movementType === MovementType.OUT) {
        if (product.currentStock < data.quantity) {
          throw {
            statusCode: 400,
            message: `Insufficient stock for product '${product.productName}'. Current stock: ${product.currentStock}, Requested reduction: ${data.quantity}`,
          };
        }
      }

      const stockDelta = data.movementType === MovementType.IN ? data.quantity : -data.quantity;

      const [updatedProduct, movement] = await Promise.all([
        tx.product.update({
          where: { id: data.productId },
          data: {
            currentStock: {
              increment: stockDelta,
            },
          },
        }),
        tx.stockMovement.create({
          data: {
            productId: data.productId,
            quantity: data.quantity,
            movementType: data.movementType,
            reason: data.reason,
            createdById: userId,
          },
          include: {
            product: { select: { id: true, productName: true, sku: true, currentStock: true } },
            createdBy: { select: { id: true, name: true, role: true } },
          },
        }),
      ]);

      return movement;
    });
  }
}
