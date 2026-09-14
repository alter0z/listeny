import { NextRequest, NextResponse } from 'next/server';
import { getPlaylistDetails } from '@/lib/innertube';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 });
  }

  try {
    const playlist = await getPlaylistDetails(id);
    return NextResponse.json(playlist);
  } catch (error: unknown) {
    console.error(`Playlist details error for ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch playlist', message: (error as Error)?.message || String(error) },
      { status: 500 }
    );
  }
}
