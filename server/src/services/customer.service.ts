import prisma from '../config/prisma';
import { CreateCustomerInput, UpdateCustomerInput, AddFollowUpInput } from '../validators/customer.validator';
import { CustomerType, CustomerStatus } from '@prisma/client';
import { AppError } from '../utils/appError';

export class CustomerService {
  static async getAll(query: {
    search?: string;
    status?: CustomerStatus;
    customerType?: CustomerType;
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

    if (query.customerType) {
      where.customerType = query.customerType;
    }

    if (query.search) {
      const searchLower = query.search.trim();
      where.OR = [
        { name: { contains: searchLower, mode: 'insensitive' } },
        { mobile: { contains: searchLower, mode: 'insensitive' } },
        { email: { contains: searchLower, mode: 'insensitive' } },
        { businessName: { contains: searchLower, mode: 'insensitive' } },
        { gstNumber: { contains: searchLower, mode: 'insensitive' } },
      ];
    }

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { followUps: true, salesChallans: true },
          },
        },
      }),
    ]);

    return {
      customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        followUps: {
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: { id: true, name: true, role: true },
            },
          },
        },
        salesChallans: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    return customer;
  }

  static async create(data: CreateCustomerInput) {
    const followUpDate = data.followUpDate ? new Date(data.followUpDate) : null;

    return prisma.customer.create({
      data: {
        ...data,
        email: data.email || null,
        businessName: data.businessName || null,
        gstNumber: data.gstNumber || null,
        address: data.address || null,
        notes: data.notes || null,
        followUpDate,
      },
    });
  }

  static async update(id: string, data: UpdateCustomerInput) {
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(404, 'Customer not found');
    }

    const updateData: any = { ...data };
    if (data.followUpDate !== undefined) {
      updateData.followUpDate = data.followUpDate ? new Date(data.followUpDate) : null;
    }

    return prisma.customer.update({
      where: { id },
      data: updateData,
    });
  }

  static async delete(id: string) {
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(404, 'Customer not found');
    }

    return prisma.customer.delete({ where: { id } });
  }

  static async addFollowUp(customerId: string, userId: string, data: AddFollowUpInput) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    const followUpDate = data.date ? new Date(data.date) : new Date();

    const [followUp] = await prisma.$transaction([
      prisma.followUp.create({
        data: {
          customerId,
          note: data.note,
          date: followUpDate,
          createdById: userId,
        },
      }),
      prisma.customer.update({
        where: { id: customerId },
        data: { followUpDate },
      }),
    ]);

    return followUp;
  }
}
