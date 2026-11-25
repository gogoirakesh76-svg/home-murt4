import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import {
  adminLogin,
  adminLogout,
  getAdminAuthStatus,
  getAdminMe,
  getAdminSession,
  setupFirstAdmin,
} from '../controllers/adminAuthController.ts';
import {
  createCoupon,
  createProduct,
  deleteCoupon,
  deleteProduct,
  getDashboardStats,
  listAddresses,
  listAllOrders,
  listCoupons,
  listReturnRequests,
  listUsers,
  resolveReturnRequest,
  toggleBlockUser,
  toggleCoupon,
  updateOrderStatus,
  updateProduct,
  uploadProductImage,
} from '../controllers/adminController.ts';
import { adminAuth } from '../middleware/auth.ts';

const uploadsDir = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = MIME_TO_EXT[file.mimetype] || '.jpg';
      cb(null, `hm-${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (MIME_TO_EXT[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and WebP images are allowed.'));
    }
  },
});

const router = Router();

// Admin auth endpoints (public login/status/setup, protected /me)
router.get('/auth/status', getAdminAuthStatus);
router.get('/auth/session', getAdminSession);
router.post('/auth/setup', setupFirstAdmin);
router.post('/auth/login', adminLogin);
router.post('/auth/logout', adminLogout);
router.get('/auth/me', adminAuth, getAdminMe);

// Protected admin management endpoints
router.use(adminAuth);
router.get('/dashboard', getDashboardStats);

router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.post('/upload', upload.single('image'), uploadProductImage);

router.get('/orders', listAllOrders);
router.patch('/orders/:id/status', updateOrderStatus);

router.get('/returns', listReturnRequests);
router.patch('/returns/:id', resolveReturnRequest);

router.get('/coupons', listCoupons);
router.post('/coupons', createCoupon);
router.patch('/coupons/:id/toggle', toggleCoupon);
router.delete('/coupons/:id', deleteCoupon);

router.get('/users', listUsers);
router.patch('/users/:id/block', toggleBlockUser);

router.get('/addresses', listAddresses);

export default router;
