import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Database } from './server/db.js';
import app from './server/app.js';

/**
 * Local dev / standalone Node server entry point (used by `npm run dev` and
 * `npm start`). Not used on Vercel — there, `api/index.ts` exports the same
 * `server/app.ts` Express app directly as a serverless function, and static
 * assets are served by Vercel's own static hosting instead of the block below.
 */
async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  console.log('🚀 Initializing Mutual Fund Database...');
  await Database.init();

  // Vite middleware for development vs static dist for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
