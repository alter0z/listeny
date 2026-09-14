import { NextRequest, NextResponse } from 'next/server';
import { resolveAudioStreamUrl } from '@/lib/innertube';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
  }

  try {
    const { url, mimeType } = await resolveAudioStreamUrl(id);

    const rangeHeader = request.headers.get('range');
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    if (rangeHeader) {
      headers['Range'] = rangeHeader;
    }

    const upstreamResponse = await fetch(url, { headers });

    if (!upstreamResponse.ok && upstreamResponse.status !== 206) {
      return NextResponse.json(
        { error: 'Upstream stream error', status: upstreamResponse.status },
        { status: upstreamResponse.status }
      );
    }

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', mimeType || upstreamResponse.headers.get('content-type') || 'audio/mp4');
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Cache-Control', 'public, max-age=7200');

    const contentLength = upstreamResponse.headers.get('content-length');
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength);
    }

    const contentRange = upstreamResponse.headers.get('content-range');
    if (contentRange) {
      responseHeaders.set('Content-Range', contentRange);
    }

    return new NextResponse(upstreamResponse.body as any, {
      status: upstreamResponse.status === 206 ? 206 : 200,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error(`Stream resolution error for ID ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to resolve stream', message: error?.message || String(error) },
      { status: 500 }
    );
  }
}
