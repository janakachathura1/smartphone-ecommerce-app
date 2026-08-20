import { Router } from 'express';
import {
  getDashboardStats,
  getReportData,
  getBrands, createBrand, updateBrand, deleteBrand,
  getCategories, createCategory, updateCategory, deleteCategory,
  getReviews, updateReview, deleteReview,
  getWarranties, getWarrantyByImei, createWarranty, updateWarranty, deleteWarranty,
  createWarrantyClaim, updateWarrantyClaim,
  fulfillOrder,
  getRepairJobs, createRepairJob, updateRepairJob, deleteRepairJob,
  getTradeIns, createTradeIn, updateTradeIn, deleteTradeIn,
  getAbandonedCarts,
} from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Public / User Warranty check endpoint
router.get('/warranty/check/:imei', getWarrantyByImei);

// Protected Admin Routes
router.use(authenticate, requireAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/reports', getReportData);

// Brands
router.get('/brands', getBrands);
router.post('/brands', createBrand);
router.put('/brands/:id', updateBrand);
router.delete('/brands/:id', deleteBrand);

// Categories
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Reviews
router.get('/reviews', getReviews);
router.put('/reviews/:id', updateReview);
router.delete('/reviews/:id', deleteReview);

// Warranties & IMEI
router.get('/warranties', getWarranties);
router.get('/warranties/:imei', getWarrantyByImei);
router.post('/warranties', createWarranty);
router.put('/warranties/:id', updateWarranty);
router.delete('/warranties/:id', deleteWarranty);
router.post('/warranties/claim', createWarrantyClaim);
router.put('/warranties/claim/:id', updateWarrantyClaim);

// Order Fulfillment with IMEI & Courier
router.post('/orders/:id/fulfill', fulfillOrder);

// Smartphone Repairs
router.get('/repairs', getRepairJobs);
router.post('/repairs', createRepairJob);
router.put('/repairs/:id', updateRepairJob);
router.delete('/repairs/:id', deleteRepairJob);

// Trade-In Valuation
router.get('/trade-ins', getTradeIns);
router.post('/trade-ins', createTradeIn);
router.put('/trade-ins/:id', updateTradeIn);
router.delete('/trade-ins/:id', deleteTradeIn);

// Abandoned Carts
router.get('/abandoned-carts', getAbandonedCarts);

export default router;

