import { Router } from 'express';
import {
  getDashboardStats,
  getBrands, createBrand, updateBrand, deleteBrand,
  getCategories, createCategory, updateCategory, deleteCategory,
  getReviews, updateReview, deleteReview,
} from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/dashboard', getDashboardStats);

router.get('/brands', getBrands);
router.post('/brands', createBrand);
router.put('/brands/:id', updateBrand);
router.delete('/brands/:id', deleteBrand);

router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

router.get('/reviews', getReviews);
router.put('/reviews/:id', updateReview);
router.delete('/reviews/:id', deleteReview);

export default router;
