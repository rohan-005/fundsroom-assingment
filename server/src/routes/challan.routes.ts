import { Router } from 'express';
import { ChallanController } from '../controllers/challan.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', authorize(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS), ChallanController.getAll);
router.get('/:id', authorize(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS), ChallanController.getById);
router.post('/', authorize(Role.ADMIN, Role.SALES), ChallanController.create);
router.put('/:id', authorize(Role.ADMIN, Role.SALES), ChallanController.update);
router.post('/:id/confirm', authorize(Role.ADMIN, Role.SALES), ChallanController.confirm);

export default router;
