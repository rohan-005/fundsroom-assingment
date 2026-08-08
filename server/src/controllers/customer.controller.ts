import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../services/customer.service';
import { createCustomerSchema, updateCustomerSchema, addFollowUpSchema } from '../validators/customer.validator';

export class CustomerController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CustomerService.getAll(req.query as any);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await CustomerService.getById(req.params.id);
      return res.status(200).json({
        success: true,
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createCustomerSchema.parse(req.body);
      const customer = await CustomerService.create(parsed);
      return res.status(201).json({
        success: true,
        data: customer,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: error.errors });
      }
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateCustomerSchema.parse(req.body);
      const customer = await CustomerService.update(req.params.id, parsed);
      return res.status(200).json({
        success: true,
        data: customer,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: error.errors });
      }
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await CustomerService.delete(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Customer deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async addFollowUp(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = addFollowUpSchema.parse(req.body);
      const userId = req.user!.userId;
      const followUp = await CustomerService.addFollowUp(req.params.id, userId, parsed);
      return res.status(201).json({
        success: true,
        data: followUp,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: error.errors });
      }
      next(error);
    }
  }
}
