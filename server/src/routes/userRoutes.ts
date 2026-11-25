import { Router } from 'express';
import {
  addAddress,
  deleteAddress,
  getAddresses,
  getWishlist,
  toggleWishlist,
} from '../controllers/userController.ts';
import { userAuth } from '../middleware/auth.ts';

const router = Router();

router.use(userAuth);
router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.delete('/addresses/:id', deleteAddress);
router.get('/wishlist', getWishlist);
router.post('/wishlist/toggle', toggleWishlist);

export default router;
