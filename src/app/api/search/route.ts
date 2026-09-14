import { NextRequest, NextResponse } from 'next/server';
import { searchMusic } from '@/lib/innertube';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const type = searchParams.get('type') as 'song' | 'album' | 'artist' | 'playlist' | null;

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  try {
    const results = await searchMusic(query.trim(), type || undefined);
    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Failed to search music', message: error?.message || String(error) },
      { status: 500 }
    );
  }
}
