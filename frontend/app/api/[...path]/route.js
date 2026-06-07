import { NextResponse } from 'next/server';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000').replace(
  '://localhost',
  '://127.0.0.1',
);

async function proxyRequest(request, context) {
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
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  let res;
  try {
    res = await fetch(target, { ...init, signal: controller.signal });
  } catch {
    return NextResponse.json(
      { message: 'Cannot reach the API server. Ensure the backend is running on port 4000.' },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const contentType = res.headers.get('content-type') || 'application/json';
  const isBinary =
    contentType.includes('octet-stream') ||
    contentType.includes('application/pdf') ||
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
