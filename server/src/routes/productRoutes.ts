import { Router } from 'express';
import {
  createProductReview,
  getProductByIdOrSlug,
  listCategories,
  listProducts,
} from '../controllers/productController.ts';
import { userAuth } from '../middleware/auth.ts';

const router = Router();

router.get('/categories', listCategories);
router.get('/products', listProducts);
router.get('/products/:idOrSlug', getProductByIdOrSlug);
router.post('/products/:id/reviews', userAuth, createProductReview);

export default router;
