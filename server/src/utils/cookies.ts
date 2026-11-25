import type { Request, Response } from 'express';

export const USER_COOKIE_NAME = 'hm_token';
export const ADMIN_COOKIE_NAME = 'hm_admin_token';

function isHttpsRequest(req: Request): boolean {
  const forwardedProto = req.headers['x-forwarded-proto'];
  if (typeof forwardedProto === 'string') {
    return forwardedProto.split(',')[0].trim() === 'https';
  }
  return req.secure;
}

export function setAuthCookie(req: Request, res: Response, name: string, token: string) {
  const isHttps = isHttpsRequest(req);
  res.cookie(name, token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    partitioned: isHttps ? true : undefined,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearAuthCookie(req: Request, res: Response, name: string) {
  const isHttps = isHttpsRequest(req);
  res.clearCookie(name, {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    partitioned: isHttps ? true : undefined,
    path: '/',
  });
}
