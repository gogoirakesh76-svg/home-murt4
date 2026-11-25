import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.ts';
import { Models } from '../models/index.ts';
import { ADMIN_COOKIE_NAME, USER_COOKIE_NAME } from '../utils/cookies.ts';

export interface AuthUserPayload {
  userId: number;
  email: string;
  role: string;
}

export interface AdminPayload {
  email: string;
  role: 'ADMIN';
  isAdminSession: true;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
  admin?: AdminPayload;
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const token = header.slice(7).trim();
    if (token && token !== 'null' && token !== 'undefined') {
      return token;
    }
  }
  return null;
}

export async function userAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const bearer = extractBearerToken(req);
    const cookieToken = req.cookies?.[USER_COOKIE_NAME] as string | undefined;
    const token = bearer || cookieToken;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }

    if (!bearer && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const requestedWith = req.headers['x-requested-with'];
      if (requestedWith !== 'XMLHttpRequest') {
        return res.status(403).json({ error: 'CSRF check failed: missing request header.' });
      }
    }

    const decoded = jwt.verify(token, env.jwtSecret) as AuthUserPayload;
    if (!decoded || typeof decoded.userId !== 'number') {
      return res.status(401).json({ error: 'Invalid session token.' });
    }

    const user = await Models.User.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(401).json({ error: 'Account not found.' });
    }
    if (user.isBlocked) {
      return res.status(403).json({ error: 'Your account has been suspended. Contact support.' });
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }
}

export async function adminAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const bearer = extractBearerToken(req);
    const cookieToken = req.cookies?.[ADMIN_COOKIE_NAME] as string | undefined;
    const token = bearer || cookieToken;

    if (!token) {
      return res.status(401).json({ error: 'Admin authentication required.' });
    }

    if (!bearer && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const requestedWith = req.headers['x-requested-with'];
      if (requestedWith !== 'XMLHttpRequest') {
        return res.status(403).json({ error: 'CSRF check failed: missing request header.' });
      }
    }

    const decoded = jwt.verify(token, env.jwtSecret) as AdminPayload;
    if (!decoded || decoded.role !== 'ADMIN' || decoded.isAdminSession !== true) {
      return res.status(403).json({ error: 'Admin privileges required.' });
    }

    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Admin session expired or invalid.' });
  }
}
