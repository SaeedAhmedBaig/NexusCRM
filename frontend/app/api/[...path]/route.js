import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const configuredApiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
const API_URL = (configuredApiUrl || 'http://127.0.0.1:4000')
  .replace(/\/$/, '')
  .replace('://localhost', '://127.0.0.1');
const PROXY_TIMEOUT_MS = Number(process.env.API_PROXY_TIMEOUT_MS || 55_000);

async function proxyRequest(request, context) {
  if (!configuredApiUrl && process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      {
        message:
          'API server is not configured. Set API_URL or NEXT_PUBLIC_API_URL to your Render backend URL and redeploy.',
      },
      { status: 500 },
    );
  }

  const { path } = await context.params;
  const target = `${API_URL}/api/${path.join('/')}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'host') return;
    headers.set(key, value);
  });

  const init = {
    method: request.method,
    headers,
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.text();
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(target, { ...init, signal: controller.signal });
  } catch (err) {
    const timedOut = err?.name === 'AbortError';
    return NextResponse.json(
      {
        message: timedOut
          ? `Render API did not respond within ${Math.round(PROXY_TIMEOUT_MS / 1000)} seconds. The backend may be cold starting; retry in a moment or increase API_PROXY_TIMEOUT_MS.`
          : 'Cannot reach the API server. Set API_URL or NEXT_PUBLIC_API_URL to your Render backend URL and redeploy.',
      },
      { status: timedOut ? 504 : 502 },
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const contentType = res.headers.get('content-type') || 'application/json';
  const isBinary =
    contentType.includes('octet-stream') ||
    contentType.includes('application/pdf') ||
    contentType.includes('spreadsheetml') ||
    contentType.includes('application/vnd.ms-excel') ||
    contentType.includes('image/') ||
    contentType.includes('application/zip');

  const body = isBinary ? await res.arrayBuffer() : await res.text();
  const responseHeaders = { 'Content-Type': contentType };
  const disposition = res.headers.get('content-disposition');
  if (disposition) responseHeaders['Content-Disposition'] = disposition;

  return new NextResponse(body, {
    status: res.status,
    headers: responseHeaders,
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
