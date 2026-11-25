import path from 'node:path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { getAllowedOrigins } from './config/env.ts';
import adminRoutes from './routes/adminRoutes.ts';
import authRoutes from './routes/authRoutes.ts';
import orderRoutes from './routes/orderRoutes.ts';
import productRoutes from './routes/productRoutes.ts';
import userRoutes from './routes/userRoutes.ts';

export function createApiApp() {
  const app = express();
  app.set('trust proxy', 1);

  const allowedOrigins = getAllowedOrigins();

  const corsMiddleware: express.RequestHandler = (req, res, next) => {
    const requestHost = req.get('host');
    return cors({
      origin: (origin, callback) => {
        if (!origin) {
          return callback(null, true);
        }
        const normalized = origin.replace(/\/+$/, '');
        if (
          requestHost &&
          (normalized === `http://${requestHost}` || normalized === `https://${requestHost}`)
        ) {
          return callback(null, true);
        }
        if (allowedOrigins.length === 0 || allowedOrigins.includes(normalized)) {
          return callback(null, true);
        }
        if (normalized.endsWith('.vercel.app') && allowedOrigins.some((o) => o.endsWith('.vercel.app'))) {
          return callback(null, true);
        }
        return callback(new Error('Origin not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })(req, res, next);
  };

  app.use('/api', corsMiddleware);
  app.use('/uploads', corsMiddleware);

  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());

  // Serve uploaded product images safely
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  // Health check for Render/Railway
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'homemurt-api' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api', productRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api', orderRoutes);
  app.use('/api/admin', adminRoutes);

  // Global error handler for multer / JSON / CORS errors
  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error('Unhandled API error:', err.message);
      res.status(400).json({ error: err.message || 'Request failed.' });
    }
  );

  return app;
}
