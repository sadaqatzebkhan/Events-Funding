import express from 'express';
import dotenv from 'dotenv';
import { Database } from './db.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import eventsRoutes from './routes/events.js';
import membersRoutes from './routes/members.js';
import { loginRateLimiter } from './rateLimiter.js';

dotenv.config();

/**
 * The API-only Express app — no static file serving, no Vite. Shared between:
 *   - api/index.ts (the Vercel serverless function entry)
 *   - server.ts (the local dev/standalone-server entry, which layers Vite
 *     middleware / static `dist/` serving on top of this same app)
 */
const app = express();

app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  // Explicitly allow camera/microphone for this origin — needed for an
  // upcoming payment-proof photo upload feature. No CSP is set elsewhere
  // that would additionally restrict this; declaring it here just removes
  // any ambiguity from a host's own default policy.
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }
  next();
});

app.use(express.json());

// Every request waits for the database to be ready. Database.init() memoizes
// after its first successful run in a given process, so on a warm serverless
// instance (or the long-running local dev server) this resolves immediately.
app.use(async (_req, res, next) => {
  try {
    await Database.init();
    next();
  } catch (err: any) {
    res.status(503).json({ error: `Database unavailable: ${err?.message || err}` });
  }
});

app.use('/api/auth/login', loginRateLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/members', membersRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'Mutual Fund' });
});

export default app;
