import { Router } from 'express';
import {
  getMe,
  getSession,
  login,
  logout,
  register,
  updateProfile,
} from '../controllers/authController.ts';
import { userAuth } from '../middleware/auth.ts';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/session', getSession);
router.get('/me', userAuth, getMe);
router.put('/profile', userAuth, updateProfile);

export default router;
