import { NextRequest, NextResponse } from 'next/server';
import { getVideoDurations } from '@/lib/innertube';

/**
 * Enriches locally-parsed playlist imports (CSV / M3U) with real
 * durations from YouTube. Receives a list of video IDs and returns
 * a mapping of id -> duration in seconds.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const videoIds: string[] = Array.isArray(body?.videoIds)
      ? body.videoIds.filter((id: unknown) => typeof id === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(id))
      : [];

    if (videoIds.length === 0) {
      return NextResponse.json({ durations: {} });
    }

    const durations = await getVideoDurations(videoIds);

    return NextResponse.json({
      durations,
      enriched: Object.keys(durations).length,
      requested: videoIds.length,
    });
  } catch (error: unknown) {
    console.error('File import enrichment error:', error);
    return NextResponse.json(
      { error: 'Failed to enrich track durations', message: (error as Error)?.message || String(error) },
      { status: 500 }
    );
  }
}