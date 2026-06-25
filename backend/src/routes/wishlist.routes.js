import { Router } from 'express';
import { getWishlist, toggleWishlistItem, removeWishlistItem } from '../controllers/wishlist.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.get('/', getWishlist);
router.post('/toggle', toggleWishlistItem);
router.delete('/:productId', removeWishlistItem);

export default router;
