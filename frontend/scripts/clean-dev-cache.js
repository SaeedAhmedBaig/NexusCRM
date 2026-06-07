/**
 * Clears Next.js dev/build cache. Run: npm run dev:clean
 */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execSync } = require('node:child_process');

const root = path.join(__dirname, '..');

function rm(target) {
  if (!fs.existsSync(target)) return;
  const stat = fs.lstatSync(target);
  if (stat.isSymbolicLink()) {
    fs.unlinkSync(target);
    console.log(`Removed junction ${target}`);
    return;
  }
  fs.rmSync(target, { recursive: true, force: true });
  console.log(`Removed ${target}`);
}

function getLocalCachePaths() {
  const localAppData =
    process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const base = path.join(localAppData, 'nexuscrm-next');
  return [path.join(base, 'turbopack-cache'), base];
}

function killPort(port) {
  if (process.platform !== 'win32') return;
  try {
    execSync(
      `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`,
      { stdio: 'ignore' },
    );
    console.log(`Freed port ${port} (if it was in use)`);
  } catch {
    // ignore
  }
}

const cacheLink = path.join(root, '.next', 'dev', 'cache');
if (fs.existsSync(cacheLink)) {
  const stat = fs.lstatSync(cacheLink);
  if (stat.isSymbolicLink()) {
    fs.unlinkSync(cacheLink);
    console.log(`Removed junction ${cacheLink}`);
  }
}

rm(path.join(root, '.next'));
for (const target of getLocalCachePaths()) {
  rm(target);
}

killPort(3000);

console.log('Dev cache cleared. Run npm run dev to start fresh.');
