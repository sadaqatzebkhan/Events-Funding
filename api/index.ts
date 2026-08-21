import app from '../server/app.js';

// Vercel serverless function entry point. `vercel.json` rewrites every
// `/api/*` request to this function; the Express app inside `server/app.js`
// does its own internal routing based on the original request path.
export default app;
