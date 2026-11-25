import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { env } from './server/src/config/env.ts';
import { createApiApp } from './server/src/app.ts';
import { seedDatabaseIfEmpty } from './server/src/utils/seed.ts';

async function startServer() {
  await seedDatabaseIfEmpty();

  const app = createApiApp();

  if (env.nodeEnv !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
          return next();
        }
        return res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  app.listen(env.port, '0.0.0.0', () => {
    console.log(`HOME MURT server running on port ${env.port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start HOME MURT server:', err);
  process.exit(1);
});
