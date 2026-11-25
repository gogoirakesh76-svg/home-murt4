import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.ts';
import { Models } from '../models/index.ts';
import { ADMIN_COOKIE_NAME, clearAuthCookie, setAuthCookie } from '../utils/cookies.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';

function signAdminToken(email: string) {
  return jwt.sign(
    { email, role: 'ADMIN', isAdminSession: true },
    env.jwtSecret,
    { expiresIn: '1d' }
  );
}

export async function getAdminAuthStatus(_req: Request, res: Response) {
  try {
    if (env.adminEmail && env.adminPasswordHash) {
      return res.json({
        configured: true,
        mode: 'env',
      });
    }

    const claimed = await Models.AdminCredential.findFirst();
    if (claimed) {
      return res.json({
        configured: true,
        mode: 'claimed',
      });
    }

    return res.json({
      configured: false,
      mode: 'unclaimed',
    });
  } catch (err) {
    console.error('Admin status error:', err);
    return res.status(500).json({ error: 'Failed to check admin configuration.' });
  }
}

export async function setupFirstAdmin(req: Request, res: Response) {
  try {
    if (env.adminEmail && env.adminPasswordHash) {
      return res.status(403).json({
        error: 'Admin credentials are already configured via environment variables.',
      });
    }

    const existing = await Models.AdminCredential.findFirst();
    if (existing) {
      return res.status(403).json({
        error: 'Admin account has already been claimed. Please sign in.',
      });
    }

    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid admin email.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Admin password must be at least 8 characters.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await Models.AdminCredential.create({
      data: { id: 1, email, passwordHash },
    });

    const token = signAdminToken(email);
    setAuthCookie(req, res, ADMIN_COOKIE_NAME, token);

    return res.status(201).json({
      token,
      admin: { email, role: 'ADMIN' },
    });
  } catch (err) {
    console.error('Setup admin error:', err);
    return res.status(500).json({ error: 'Failed to claim admin account.' });
  }
}

export async function adminLogin(req: Request, res: Response) {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({ error: 'Admin email and password are required.' });
    }

    // Environment variables always take precedence when configured
    if (env.adminEmail && env.adminPasswordHash) {
      if (email !== env.adminEmail) {
        return res.status(401).json({ error: 'Invalid admin credentials.' });
      }
      const valid = await bcrypt.compare(password, env.adminPasswordHash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid admin credentials.' });
      }
      const token = signAdminToken(email);
      setAuthCookie(req, res, ADMIN_COOKIE_NAME, token);
      return res.json({ token, admin: { email, role: 'ADMIN' } });
    }

    const claimed = await Models.AdminCredential.findFirst();
    if (!claimed) {
      return res.status(400).json({
        error: 'Admin account not yet configured. Complete first-time setup.',
      });
    }

    if (email !== claimed.email) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }
    const valid = await bcrypt.compare(password, claimed.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    const token = signAdminToken(email);
    setAuthCookie(req, res, ADMIN_COOKIE_NAME, token);
    return res.json({ token, admin: { email, role: 'ADMIN' } });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ error: 'Admin sign in failed.' });
  }
}

export function adminLogout(req: Request, res: Response) {
  clearAuthCookie(req, res, ADMIN_COOKIE_NAME);
  return res.json({ message: 'Admin signed out.' });
}

export function getAdminMe(req: AuthenticatedRequest, res: Response) {
  if (!req.admin) {
    return res.status(401).json({ error: 'Not authenticated as admin' });
  }
  return res.json({ admin: { email: req.admin.email, role: 'ADMIN' } });
}

export function getAdminSession(req: Request, res: Response) {
  try {
    const bearer = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7).trim()
      : null;
    const cookieToken = req.cookies?.[ADMIN_COOKIE_NAME] as string | undefined;
    const token = bearer || cookieToken;
    if (!token) {
      return res.json({ admin: null });
    }
    const decoded = jwt.verify(token, env.jwtSecret) as {
      email?: string;
      role?: string;
      isAdminSession?: boolean;
    };
    if (decoded?.role === 'ADMIN' && decoded?.isAdminSession === true && decoded?.email) {
      return res.json({ admin: { email: decoded.email, role: 'ADMIN' } });
    }
    return res.json({ admin: null });
  } catch {
    return res.json({ admin: null });
  }
}
