import { NextRequest, NextResponse } from 'next/server';
import { getArtistDetails } from '@/lib/innertube';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Artist ID is required' }, { status: 400 });
  }

  try {
    const artist = await getArtistDetails(id);
    return NextResponse.json(artist);
  } catch (error: unknown) {
    console.error('Artist API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artist details', message: (error as Error)?.message || String(error) },
      { status: 500 }
    );
  }
}
