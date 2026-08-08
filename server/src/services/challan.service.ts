import prisma from '../config/prisma';
import { CreateChallanInput, UpdateChallanInput } from '../validators/challan.validator';
import { AppError } from '../utils/appError';

export class ChallanService {
  private static async generateChallanNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.salesChallan.count();
    const sequence = String(count + 1).padStart(4, '0');
    let challanNumber = `CH-${year}-${sequence}`;

    let exists = await prisma.salesChallan.findUnique({ where: { challanNumber } });
    let counter = count + 1;
    while (exists) {
      counter++;
      challanNumber = `CH-${year}-${String(counter).padStart(4, '0')}`;
      exists = await prisma.salesChallan.findUnique({ where: { challanNumber } });
    }

    return challanNumber;
  }

  static async getAll(query: {
    status?: string;
    customerId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.search) {
      const searchLower = query.search.trim();
      where.OR = [
        { challanNumber: { contains: searchLower, mode: 'insensitive' } },
        { customer: { name: { contains: searchLower, mode: 'insensitive' } } },
        { customer: { businessName: { contains: searchLower, mode: 'insensitive' } } },
      ];
    }

    const [total, challans] = await Promise.all([
      prisma.salesChallan.count({ where }),
      prisma.salesChallan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, businessName: true, mobile: true, email: true },
          },
          createdBy: {
            select: { id: true, name: true, role: true },
          },
          items: true,
        },
      }),
    ]);

    return {
      challans,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(id: string) {
    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true, role: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, productName: true, sku: true, currentStock: true, unitPrice: true } },
          },
        },
      },
    });

    if (!challan) {
      throw new AppError(404, 'Sales Challan not found');
    }

    return challan;
  }

  static async create(userId: string, data: CreateChallanInput) {
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    const productIds = data.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      throw new AppError(400, 'One or more selected products do not exist');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    let totalQuantity = 0;

    const itemsWithSnapshots = data.items.map((item) => {
      const prod = productMap.get(item.productId)!;
      totalQuantity += item.quantity;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice ?? prod.unitPrice,
        productNameSnapshot: prod.productName,
        skuSnapshot: prod.sku,
      };
    });

    const challanNumber = await ChallanService.generateChallanNumber();

    if (data.status === 'CONFIRMED') {
      return prisma.$transaction(async (tx) => {
        for (const item of itemsWithSnapshots) {
          const prod = await tx.product.findUnique({ where: { id: item.productId } });
          if (!prod || prod.currentStock < item.quantity) {
            const avail = prod ? prod.currentStock : 0;
            throw new AppError(
              400,
              `Insufficient stock for product '${item.productNameSnapshot}' (SKU: ${item.skuSnapshot}). Available: ${avail}, Requested: ${item.quantity}`
            );
          }
        }

        for (const item of itemsWithSnapshots) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { decrement: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              movementType: 'OUT',
              reason: `Challan Dispatch: ${challanNumber}`,
              createdById: userId,
            },
          });
        }

        return tx.salesChallan.create({
          data: {
            challanNumber,
            customerId: data.customerId,
            totalQuantity,
            status: 'CONFIRMED',
            createdById: userId,
            items: {
              create: itemsWithSnapshots,
            },
          },
          include: {
            customer: true,
            createdBy: { select: { id: true, name: true, role: true } },
            items: true,
          },
        });
      });
    }

    return prisma.salesChallan.create({
      data: {
        challanNumber,
        customerId: data.customerId,
        totalQuantity,
        status: 'DRAFT',
        createdById: userId,
        items: {
          create: itemsWithSnapshots,
        },
      },
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true, role: true } },
        items: true,
      },
    });
  }

  static async confirmChallan(challanId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const challan = await tx.salesChallan.findUnique({
        where: { id: challanId },
        include: { items: true },
      });

      if (!challan) {
        throw new AppError(404, 'Sales Challan not found');
      }

      if (challan.status === 'CONFIRMED') {
        throw new AppError(400, 'Challan is already confirmed');
      }

      if (challan.status === 'CANCELLED') {
        throw new AppError(400, 'Cannot confirm a cancelled challan');
      }

      for (const item of challan.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || product.currentStock < item.quantity) {
          const avail = product ? product.currentStock : 0;
          throw new AppError(
            400,
            `Insufficient stock for product '${item.productNameSnapshot}' (SKU: ${item.skuSnapshot}). Available stock: ${avail}, Required: ${item.quantity}`
          );
        }
      }

      for (const item of challan.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: 'OUT',
            reason: `Challan Dispatch: ${challan.challanNumber}`,
            createdById: userId,
          },
        });
      }

      return tx.salesChallan.update({
        where: { id: challanId },
        data: { status: 'CONFIRMED' },
        include: {
          customer: true,
          createdBy: { select: { id: true, name: true, role: true } },
          items: true,
        },
      });
    });
  }

  static async update(id: string, userId: string, data: UpdateChallanInput) {
    const existing = await prisma.salesChallan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) {
      throw new AppError(404, 'Sales Challan not found');
    }

    if (data.status === 'CONFIRMED' && existing.status === 'DRAFT') {
      return ChallanService.confirmChallan(id, userId);
    }

    if (data.status === 'CANCELLED' && existing.status !== 'CANCELLED') {
      return prisma.$transaction(async (tx) => {
        if (existing.status === 'CONFIRMED') {
          for (const item of existing.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { currentStock: { increment: item.quantity } },
            });

            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                quantity: item.quantity,
                movementType: 'IN',
                reason: `Challan Cancelled Restoration: ${existing.challanNumber}`,
                createdById: userId,
              },
            });
          }
        }

        return tx.salesChallan.update({
          where: { id },
          data: { status: 'CANCELLED' },
          include: { customer: true, items: true },
        });
      });
    }

    if (existing.status !== 'DRAFT') {
      throw new AppError(400, 'Only DRAFT challans can be edited');
    }

    if (data.items) {
      const productIds = data.items.map((i) => i.productId);
      const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
      const productMap = new Map(products.map((p) => [p.id, p]));
      let totalQuantity = 0;

      const itemsWithSnapshots = data.items.map((item) => {
        const prod = productMap.get(item.productId)!;
        totalQuantity += item.quantity;
        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice ?? prod.unitPrice,
          productNameSnapshot: prod.productName,
          skuSnapshot: prod.sku,
        };
      });

      await prisma.salesChallanItem.deleteMany({ where: { challanId: id } });

      return prisma.salesChallan.update({
        where: { id },
        data: {
          ...(data.customerId ? { customerId: data.customerId } : {}),
          totalQuantity,
          items: { create: itemsWithSnapshots },
        },
        include: { customer: true, items: true },
      });
    }

    return prisma.salesChallan.update({
      where: { id },
      data: {
        ...(data.customerId ? { customerId: data.customerId } : {}),
      },
      include: { customer: true, items: true },
    });
  }
}
