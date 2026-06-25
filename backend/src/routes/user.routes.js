import { Router } from 'express';
import {
  getProfile, updateProfile, changePassword,
  getAddresses, addAddress, updateAddress, deleteAddress,
  getAllUsers, toggleUserStatus,
} from '../controllers/user.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.patch('/change-password', changePassword);
router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.put('/addresses/:id', updateAddress);
router.delete('/addresses/:id', deleteAddress);

// Admin
router.get('/', requireAdmin, getAllUsers);
router.patch('/:id/toggle-status', requireAdmin, toggleUserStatus);

export default router;
