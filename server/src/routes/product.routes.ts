import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', authorize(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS), ProductController.getAll);
router.get('/:id', authorize(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS), ProductController.getById);
router.post('/', authorize(Role.ADMIN, Role.WAREHOUSE), ProductController.create);
router.put('/:id', authorize(Role.ADMIN, Role.WAREHOUSE), ProductController.update);

export default router;
