import { handleRewriteRequest } from '../server/rewrite-handler.js';
import { loadLocalEnvironment } from '../server/local-env.js';

loadLocalEnvironment();

// Vercel Node.js Web Handlers. All methods share the same safe response headers.
export const POST = handleRewriteRequest;
export const GET = handleRewriteRequest;
export const PUT = handleRewriteRequest;
export const PATCH = handleRewriteRequest;
export const DELETE = handleRewriteRequest;
export const OPTIONS = handleRewriteRequest;
export const HEAD = handleRewriteRequest;
