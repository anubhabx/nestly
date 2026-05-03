import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  getFeaturedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  productValidators,
} from '../controllers/product.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = Router();

// Public routes - products can be viewed by anyone
router.get('/', getAllProducts);
router.get('/featured', getFeaturedProducts);
router.get('/:id', getProductById);

// Protected routes - products management
router.use(protect);

router.post('/', validate, ...productValidators.create, createProduct);
router.put('/:id', validate, ...productValidators.update, updateProduct);
router.delete('/:id', deleteProduct);

export { router as productRouter };
