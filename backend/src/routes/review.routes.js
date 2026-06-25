import { Router } from 'express';
import { getProductReviews, addReview, updateReview, deleteReview } from '../controllers/review.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/product/:productId', getProductReviews);
router.post('/', authenticate, addReview);
router.put('/:id', authenticate, updateReview);
router.delete('/:id', authenticate, deleteReview);

export default router;
