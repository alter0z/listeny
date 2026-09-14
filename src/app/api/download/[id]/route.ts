import { NextRequest, NextResponse } from 'next/server';
import { resolveAudioStreamUrl } from '@/lib/innertube';

function sanitizeFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '_').trim();
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const searchParams = request.nextUrl.searchParams;
  const title = searchParams.get('title') || 'audio';
  const artist = searchParams.get('artist') || '';

  if (!id) {
    return NextResponse.json({ error: 'Track ID is required' }, { status: 400 });
  }

  try {
    const { url, mimeType } = await resolveAudioStreamUrl(id);

    const upstreamResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to download upstream audio' },
        { status: upstreamResponse.status }
      );
    }

    const ext = mimeType.includes('webm') ? 'webm' : 'm4a';
    const baseName = artist ? `${artist} - ${title}` : title;
    const filename = `${sanitizeFilename(baseName)}.${ext}`;

    const headers = new Headers();
    // Always serve downloads with audio/* mime type even if the upstream format is muxed video
    const downloadMime = mimeType.replace('video/', 'audio/');
    headers.set('Content-Type', downloadMime);
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`);

    const contentLength = upstreamResponse.headers.get('content-length');
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }

    return new NextResponse(upstreamResponse.body, {
      status: 200,
      headers,
    });
  } catch (error: unknown) {
    console.error(`Download error for ID ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to download track', message: (error as Error)?.message || String(error) },
      { status: 500 }
    );
  }
}
