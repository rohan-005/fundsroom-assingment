import { Request, Response, NextFunction } from 'express';
import { StockService } from '../services/stock.service';
import { createStockMovementSchema } from '../validators/stock.validator';

export class StockController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await StockService.getAll(req.query as any);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createStockMovementSchema.parse(req.body);
      const userId = req.user!.userId;
      const movement = await StockService.create(userId, parsed);

      return res.status(201).json({
        success: true,
        data: movement,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: error.errors });
      }
      next(error);
    }
  }
}
