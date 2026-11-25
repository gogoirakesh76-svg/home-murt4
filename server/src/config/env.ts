import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

// Ensure SQLite local DB path is valid before PrismaClient initializes
const schemaPath = path.resolve(process.cwd(), 'prisma', 'schema.prisma');
const isSqliteSchema =
  fs.existsSync(schemaPath) && fs.readFileSync(schemaPath, 'utf8').includes('provider = "sqlite"');
const rawDbUrl = (process.env.DATABASE_URL || '').trim();
if (!rawDbUrl || (isSqliteSchema && !rawDbUrl.startsWith('file:'))) {
  process.env.DATABASE_URL = 'file:./dev.db';
}

const fallbackJwtSecret = crypto.randomBytes(32).toString('hex');
const envPort = Number(process.env.PORT);
const defaultAppPort = Number(process.env.DEFAULT_APP_PORT) || 3000;
const isAiStudioContainer =
  Boolean(process.env.CONTROL_PLANE_PORT) ||
  Boolean(process.env.NGINX_PORT) ||
  Boolean(process.env.APP_URL);
const collidesWithNginx =
  Number.isFinite(envPort) &&
  envPort > 0 &&
  ((process.env.NGINX_PORT && envPort === Number(process.env.NGINX_PORT)) ||
    (envPort === 8080 && (isAiStudioContainer || process.env.NODE_ENV !== 'production')));

export const env = {
  port: collidesWithNginx
    ? defaultAppPort
    : Number.isFinite(envPort) && envPort > 0
      ? envPort
      : defaultAppPort,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length >= 16
    ? process.env.JWT_SECRET.trim()
    : fallbackJwtSecret,
  adminEmail: (process.env.ADMIN_EMAIL || '').trim().toLowerCase(),
  adminPasswordHash: (process.env.ADMIN_PASSWORD_HASH || '').trim(),
  frontendUrl: (process.env.FRONTEND_URL || '').trim(),
  appUrl: (process.env.APP_URL || '').trim(),
};

export function getAllowedOrigins(): string[] {
  const origins = new Set<string>();
  const raw = [env.frontendUrl, env.appUrl, process.env.CORS_ORIGINS || '']
    .filter(Boolean)
    .join(',');
  for (const part of raw.split(',')) {
    const trimmed = part.trim().replace(/\/+$/, '');
    if (trimmed && trimmed !== 'MY_APP_URL') {
      origins.add(trimmed);
    }
  }
  return Array.from(origins);
}
