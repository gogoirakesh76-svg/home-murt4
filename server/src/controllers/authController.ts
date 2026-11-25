import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.ts';
import { Models, sanitizeUser } from '../models/index.ts';
import { clearAuthCookie, setAuthCookie, USER_COOKIE_NAME } from '../utils/cookies.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';

function signUserToken(user: { id: number; email: string; role: string }) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: '7d' }
  );
}

export async function register(req: Request, res: Response) {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const phone = String(req.body?.phone || '').trim();

    if (name.length < 2) {
      return res.status(400).json({ error: 'Full name must be at least 2 characters.' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existing = await Models.User.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await Models.User.create({
      data: { name, email, passwordHash, phone, role: 'USER' },
    });

    const token = signUserToken(user);
    setAuthCookie(req, res, USER_COOKIE_NAME, token);

    return res.status(201).json({
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await Models.User.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    if (user.isBlocked) {
      return res.status(403).json({ error: 'This account has been blocked by an administrator.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signUserToken(user);
    setAuthCookie(req, res, USER_COOKIE_NAME, token);

    return res.json({
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Sign in failed. Please try again.' });
  }
}

export function logout(req: Request, res: Response) {
  clearAuthCookie(req, res, USER_COOKIE_NAME);
  return res.json({ message: 'Signed out successfully.' });
}

export async function getMe(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const user = await Models.User.findUnique({ where: { id: req.user.userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error('Get me error:', err);
    return res.status(500).json({ error: 'Failed to load profile' });
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const name = String(req.body?.name || '').trim();
    const phone = String(req.body?.phone || '').trim();

    if (name.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters.' });
    }

    const updated = await Models.User.update({
      where: { id: req.user.userId },
      data: { name, phone },
    });
    return res.json({ user: sanitizeUser(updated) });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
}

export async function getSession(req: Request, res: Response) {
  try {
    const bearer = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7).trim()
      : null;
    const cookieToken = req.cookies?.[USER_COOKIE_NAME] as string | undefined;
    const token = bearer || cookieToken;
    if (!token) {
      return res.json({ user: null });
    }
    const decoded = jwt.verify(token, env.jwtSecret) as { userId?: number };
    if (!decoded?.userId) {
      return res.json({ user: null });
    }
    const user = await Models.User.findUnique({ where: { id: decoded.userId } });
    if (!user || user.isBlocked) {
      return res.json({ user: null });
    }
    return res.json({ user: sanitizeUser(user) });
  } catch {
    return res.json({ user: null });
  }
}
