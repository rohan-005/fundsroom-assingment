import { Router } from 'express';
import { StockController } from '../controllers/stock.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', authorize(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS), StockController.getAll);
router.post('/', authorize(Role.ADMIN, Role.WAREHOUSE), StockController.create);

export default router;
