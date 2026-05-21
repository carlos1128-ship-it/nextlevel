import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const scanRoots = ['App.tsx', 'pages', 'src', 'services'];
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx']);

function walk(path) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) return [];
  const stat = statSync(fullPath);
  if (stat.isFile()) return [fullPath];
  return readdirSync(fullPath).flatMap((name) => walk(join(path, name)));
}

function extensionOf(path) {
  const dotIndex = path.lastIndexOf('.');
  return dotIndex >= 0 ? path.slice(dotIndex) : '';
}

const files = scanRoots
  .flatMap(walk)
  .filter((file) => sourceExtensions.has(extensionOf(file)));

const forbiddenPatterns = [
  /localStorage\.setItem\(\s*['"`]refresh[_-]?token['"`]/i,
  /localStorage\.getItem\(\s*['"`]refresh[_-]?token['"`]/i,
  /sessionStorage\.setItem\(\s*['"`]refresh[_-]?token['"`]/i,
  /sessionStorage\.getItem\(\s*['"`]refresh[_-]?token['"`]/i,
  /readParam\(\s*['"`]refresh[_-]?token['"`]/i,
  /URLSearchParams\([^)]*refresh[_-]?token/i,
];

const failures = [];
for (const file of files) {
  const content = readFileSync(file, 'utf8');
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(content)) {
      failures.push(`${file.replace(`${root}\\`, '')}: ${pattern}`);
    }
  }
}

const api = readFileSync(join(root, 'src', 'services', 'api.ts'), 'utf8');
if (!api.includes('withCredentials: true')) {
  failures.push('src/services/api.ts: axios precisa usar withCredentials: true');
}
if (/post<[^>]*>\(['"`]\/auth\/refresh['"`],\s*\{/.test(api) || /post\(['"`]\/auth\/refresh['"`],\s*\{/.test(api)) {
  failures.push('src/services/api.ts: /auth/refresh nao deve enviar refresh token no body');
}

if (failures.length) {
  console.error(`Refresh token storage check failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log('Refresh token storage checks passed.');
