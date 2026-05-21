import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const api = read('src/services/api.ts');
const app = read('App.tsx');

assert(
  api.includes('restoreAuthSessionFromCallbackHash'),
  'Google callback must accept the legacy token fragment while backend deployments converge.',
);
assert(
  api.includes('legacyRefreshToken') && !api.includes("localStorage.setItem('refresh_token'"),
  'Legacy refresh fallback must be in-memory only, never localStorage.',
);
assert(
  app.includes('restoreAuthSessionFromCallbackHash(callbackHash)'),
  'Google callback route must try callback-fragment session before cookie refresh.',
);
assert(
  api.includes('withCredentials: true'),
  'API client must keep credentials enabled for HttpOnly cookie refresh.',
);
assert(
  api.includes('shouldPreferSameOriginApi') && api.includes('nextlevel.qzz.io'),
  'Production frontend must prefer the same-origin /api proxy to avoid third-party cookie blocking.',
);

console.log('google-oauth-session-check: ok');
