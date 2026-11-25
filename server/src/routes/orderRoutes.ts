import { Router } from 'express';
import {
  getMyOrders,
  listPublicCoupons,
  placeOrder,
  requestReturn,
  trackOrderByCode,
  validateCoupon,
} from '../controllers/orderController.ts';
import { userAuth } from '../middleware/auth.ts';

const router = Router();

router.get('/coupons', listPublicCoupons);
router.post('/coupons/validate', validateCoupon);
router.get('/orders/track/:orderCode', trackOrderByCode);

router.post('/orders', userAuth, placeOrder);
router.get('/orders/my', userAuth, getMyOrders);
router.post('/orders/:id/return', userAuth, requestReturn);

export default router;
