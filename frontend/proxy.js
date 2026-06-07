import { NextResponse } from 'next/server';
import { extractSubdomain } from './lib/tenant';

export function proxy(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const host = request.headers.get('host') || '';
  const subdomain = extractSubdomain(host);

  if (pathname.startsWith('/embed')) {
    return NextResponse.next();
  }

  if (!subdomain) {
    return NextResponse.next();
  }

  const publicPaths = [
    '/login',
    '/register',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/privacy',
    '/terms',
    '/contact',
    '/invite',
    '/embed',
  ];
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  if (pathname.startsWith(`/${subdomain}`)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${subdomain}${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
