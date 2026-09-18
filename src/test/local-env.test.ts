// @vitest-environment node
import { loadEnvFile } from 'node:process';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadLocalEnvironment } from '../../server/local-env';

vi.mock('node:process', () => ({ loadEnvFile: vi.fn() }));
afterEach(() => { vi.unstubAllEnvs(); vi.resetAllMocks(); });
describe('local server environment bootstrap (mock loader, never reads actual files)', () => {
  it('loads only the root .env.local in Vercel development', () => {
    vi.stubEnv('VERCEL_ENV', 'development'); loadLocalEnvironment();
    expect(loadEnvFile).toHaveBeenCalledExactlyOnceWith(resolve(process.cwd(), '.env.local'));
  });
  it('supports CLI 59 local Functions using its dev1 marker', () => {
    vi.stubEnv('VERCEL_ENV', ''); vi.stubEnv('NOW_REGION', 'dev1'); loadLocalEnvironment();
    expect(loadEnvFile).toHaveBeenCalledExactlyOnceWith(resolve(process.cwd(), '.env.local'));
  });
  it.each(['production', 'preview', ''])('does not load local files in %s', (mode) => {
    vi.stubEnv('NOW_REGION', mode ? 'dev1' : '');
    vi.stubEnv('VERCEL_ENV', mode); loadLocalEnvironment(); expect(loadEnvFile).not.toHaveBeenCalled();
  });
  it('handles missing local file without returning or logging raw errors', () => {
    vi.stubEnv('VERCEL_ENV', 'development');
    vi.mocked(loadEnvFile).mockImplementation(() => { throw new Error('private file details'); });
    expect(loadLocalEnvironment).not.toThrow();
  });
});
