import { NextRequest, NextResponse } from 'next/server';
import { resolveAudioStreamUrl } from '@/lib/innertube';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Range, Content-Type, Authorization',
  'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function HEAD(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'Video ID is required' }, { status: 400, headers: CORS_HEADERS });
  }

  try {
    const { url, mimeType, contentLength } = await resolveAudioStreamUrl(id);
    const headers = new Headers(CORS_HEADERS);
    const effectiveMime = mimeType || 'video/mp4';
    headers.set('Content-Type', effectiveMime);
    headers.set('Accept-Ranges', 'bytes');
    if (contentLength) {
      headers.set('Content-Length', String(contentLength));
    }
    return new NextResponse(null, { status: 200, headers });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Failed to resolve stream metadata' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { error: 'Video ID is required' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  try {
    const { url, mimeType, contentLength: resolvedContentLength } = await resolveAudioStreamUrl(id);

    const rangeHeader = request.headers.get('range');
    const upstreamHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    if (rangeHeader) {
      upstreamHeaders['Range'] = rangeHeader;
    }

    const upstreamResponse = await fetch(url, { headers: upstreamHeaders });

    if (!upstreamResponse.ok && upstreamResponse.status !== 206) {
      return NextResponse.json(
        { error: 'Upstream stream error', status: upstreamResponse.status },
        { status: upstreamResponse.status, headers: CORS_HEADERS }
      );
    }

    const responseHeaders = new Headers(CORS_HEADERS);
    const upstreamContentType = upstreamResponse.headers.get('content-type');
    const effectiveMime = mimeType || upstreamContentType || 'video/mp4';
    responseHeaders.set('Content-Type', effectiveMime);
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Cache-Control', 'public, max-age=7200');

    const contentLength = upstreamResponse.headers.get('content-length') || (resolvedContentLength ? String(resolvedContentLength) : null);
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength);
    }

    const contentRange = upstreamResponse.headers.get('content-range');
    if (contentRange) {
      responseHeaders.set('Content-Range', contentRange);
    }

    return new NextResponse(upstreamResponse.body, {
      status: upstreamResponse.status === 206 ? 206 : 200,
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    console.error(`Stream resolution error for ID ${id}:`, error);
    const err = error as Error;
    return NextResponse.json(
      { error: 'Failed to resolve stream', message: err?.message || String(error) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
