import { Request, Response, NextFunction } from 'express';
import { ChallanService } from '../services/challan.service';
import { createChallanSchema, updateChallanSchema } from '../validators/challan.validator';

export class ChallanController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ChallanService.getAll(req.query as any);
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
      const challan = await ChallanService.getById(req.params.id);
      return res.status(200).json({
        success: true,
        data: challan,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createChallanSchema.parse(req.body);
      const userId = req.user!.userId;
      const challan = await ChallanService.create(userId, parsed);
      return res.status(201).json({
        success: true,
        data: challan,
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
      const parsed = updateChallanSchema.parse(req.body);
      const userId = req.user!.userId;
      const challan = await ChallanService.update(req.params.id, userId, parsed);
      return res.status(200).json({
        success: true,
        data: challan,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: error.errors });
      }
      next(error);
    }
  }

  static async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const challan = await ChallanService.confirmChallan(req.params.id, userId);
      return res.status(200).json({
        success: true,
        data: challan,
        message: 'Sales Challan confirmed and stock updated',
      });
    } catch (error) {
      next(error);
    }
  }
}
