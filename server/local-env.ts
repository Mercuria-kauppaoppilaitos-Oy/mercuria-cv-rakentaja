import { loadEnvFile } from 'node:process';
import { resolve } from 'node:path';

export function loadLocalEnvironment() {
  // Vercel CLI 59 reads .env for Functions, while this project uses .env.local.
  // Node 24 loads the local file on the server only; production uses injected variables.
  const environment = process.env.VERCEL_ENV;
  const local = environment === 'development' || (!environment && process.env.NOW_REGION === 'dev1');
  // CLI 59's --local Function runtime supplies NOW_REGION=dev1, without VERCEL_ENV.
  if (!local) return;
  try { loadEnvFile(resolve(process.cwd(), '.env.local')); }
  catch { /* Missing/unreadable local configuration is handled by the API's safe missing-key response. */ }
}
