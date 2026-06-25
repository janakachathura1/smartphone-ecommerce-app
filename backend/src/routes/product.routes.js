import { Router } from 'express';
import {
  getProducts, getProductBySlug, getProductById,
  getFeaturedProducts, getNewArrivals, getBestSellers,
  createProduct, updateProduct, deleteProduct, createReview,
  searchSuggestions,
} from '../controllers/product.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/best-sellers', getBestSellers);
router.get('/suggestions', searchSuggestions);
router.get('/id/:id', getProductById);
router.get('/:slug', getProductBySlug);

router.post('/', authenticate, requireAdmin, createProduct);
router.put('/:id', authenticate, requireAdmin, updateProduct);
router.delete('/:id', authenticate, requireAdmin, deleteProduct);

router.post('/:id/reviews', authenticate, createReview);

export default router;
