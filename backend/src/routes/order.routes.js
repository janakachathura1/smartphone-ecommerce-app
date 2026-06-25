import { Router } from 'express';
import {
  createOrder, getMyOrders, getOrderById, cancelOrder,
  getAllOrders, updateOrderStatus, createAdminOrder,
} from '../controllers/order.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrderById);
router.patch('/:id/cancel', cancelOrder);

// Admin
router.get('/', requireAdmin, getAllOrders);
router.post('/admin/create', requireAdmin, createAdminOrder);
router.patch('/:id/status', requireAdmin, updateOrderStatus);

export default router;
