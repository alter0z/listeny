import { NextRequest, NextResponse } from 'next/server';
import { getAlbumDetails } from '@/lib/innertube';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: 'Album ID is required' }, { status: 400 });
  }

  try {
    const album = await getAlbumDetails(id);
    return NextResponse.json(album);
  } catch (error: any) {
    console.error(`Album details error for ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch album', message: error?.message || String(error) },
      { status: 500 }
    );
  }
}
