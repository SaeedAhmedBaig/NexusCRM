const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost';

const RESERVED_SUBDOMAINS = new Set(['www', 'app', 'api', 'admin', 'mail']);

/** Routes that always live on the root app host (never /{tenant}/...) */
const PUBLIC_APP_PATHS = new Set([
  '/login',
  '/signup',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/contact',
  '/privacy',
  '/terms',
]);

export function extractSubdomain(host) {
  if (!host) return null;

  const hostname = host.split(':')[0].toLowerCase();

  if (hostname === 'localhost' || hostname === APP_DOMAIN) {
    return null;
  }

  if (hostname.endsWith('.localhost')) {
    const subdomain = hostname.replace('.localhost', '');
    if (!subdomain || subdomain.includes('.') || RESERVED_SUBDOMAINS.has(subdomain)) {
      return null;
    }
    return subdomain;
  }

  if (hostname.endsWith(`.${APP_DOMAIN}`)) {
    const subdomain = hostname.slice(0, -(APP_DOMAIN.length + 1));
    if (!subdomain || subdomain.includes('.') || RESERVED_SUBDOMAINS.has(subdomain)) {
      return null;
    }
    return subdomain;
  }

  return null;
}

export function getAppOrigin() {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return new URL(base).origin;
}

/** Root-domain URLs for auth, marketing, legal */
export function getPublicUrl(path = '/') {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${getAppOrigin()}${normalized}`;
}

function isPublicAppPath(path) {
  const base = path.split('?')[0];
  return PUBLIC_APP_PATHS.has(base);
}

/** Tenant-scoped URLs: /{subdomain}/dashboard on localhost, subdomain.host in prod */
export function getTenantUrl(subdomain, path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (isPublicAppPath(normalizedPath)) {
    return getPublicUrl(normalizedPath);
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = new URL(base);

  if (url.hostname === 'localhost') {
    const suffix = normalizedPath === '/' ? '' : normalizedPath;
    return `${url.origin}/${subdomain}${suffix}`;
  }

  if (url.hostname.endsWith('.localhost')) {
    const port = url.port || '3000';
    return `http://${subdomain}.localhost:${port}${normalizedPath}`;
  }

  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || url.hostname;
  return `https://${subdomain}.${domain}${normalizedPath}`;
}

export async function resolveTenant(subdomain) {
  const apiBase =
    typeof window !== 'undefined'
      ? ''
      : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  try {
    const res = await fetch(`${apiBase}/api/tenants/resolve/${subdomain}`, {
      cache: 'no-store',
    });

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
