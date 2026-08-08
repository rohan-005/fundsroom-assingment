import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', authorize(Role.ADMIN, Role.SALES, Role.ACCOUNTS, Role.WAREHOUSE), CustomerController.getAll);
router.get('/:id', authorize(Role.ADMIN, Role.SALES, Role.ACCOUNTS, Role.WAREHOUSE), CustomerController.getById);
router.post('/', authorize(Role.ADMIN, Role.SALES), CustomerController.create);
router.put('/:id', authorize(Role.ADMIN, Role.SALES), CustomerController.update);
router.delete('/:id', authorize(Role.ADMIN), CustomerController.delete);
router.post('/:id/follow-ups', authorize(Role.ADMIN, Role.SALES), CustomerController.addFollowUp);

export default router;
