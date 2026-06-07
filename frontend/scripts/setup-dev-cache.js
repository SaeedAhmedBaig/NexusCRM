/**
 * Redirects .next/dev/cache to LOCALAPPDATA (fast SSD) via a Windows junction.
 * Keeps module resolution on the project drive; only Turbopack cache I/O moves local.
 */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const devDir = path.join(root, '.next', 'dev');
const cacheLink = path.join(devDir, 'cache');
const localCache = path.join(
  process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
  'nexuscrm-next',
  'turbopack-cache',
);

function isJunction(target) {
  if (!fs.existsSync(target)) return false;
  try {
    return fs.lstatSync(target).isSymbolicLink();
  } catch {
    return false;
  }
}

if (process.platform !== 'win32') {
  process.exit(0);
}

fs.mkdirSync(localCache, { recursive: true });
fs.mkdirSync(devDir, { recursive: true });

if (fs.existsSync(cacheLink)) {
  if (isJunction(cacheLink)) {
    process.exit(0);
  }
  fs.rmSync(cacheLink, { recursive: true, force: true });
}

const cacheLinkWin = cacheLink.replace(/\//g, '\\');
const localCacheWin = localCache.replace(/\//g, '\\');

try {
  execSync(`cmd /c mklink /J "${cacheLinkWin}" "${localCacheWin}"`, { stdio: 'ignore' });
  console.log(`Turbopack cache junction: ${cacheLinkWin} -> ${localCacheWin}`);
} catch {
  // Non-fatal: dev still works with cache on the project drive
}
