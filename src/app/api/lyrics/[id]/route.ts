import { NextRequest, NextResponse } from 'next/server';
import { getLyricsData } from '@/lib/innertube';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const searchParams = request.nextUrl.searchParams;
  const title = searchParams.get('title') || undefined;
  const artist = searchParams.get('artist') || undefined;
  const duration = searchParams.get('duration') ? parseFloat(searchParams.get('duration')!) : undefined;

  if (!id) {
    return NextResponse.json({ error: 'Track ID is required' }, { status: 400 });
  }

  try {
    const lyrics = await getLyricsData(id, title, artist, duration);
    return NextResponse.json(lyrics);
  } catch (error: any) {
    console.error(`Lyrics error for track ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch lyrics', message: error?.message || String(error) },
      { status: 500 }
    );
  }
}
