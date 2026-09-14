import { NextRequest, NextResponse } from 'next/server';
import { getPlaylistDetails } from '@/lib/innertube';
import type { Playlist } from '@/types/music';

function extractPlaylistId(url: string): string | null {
  if (!url) return null;
  // If user passed bare playlist ID
  if (/^[a-zA-Z0-9_-]{10,}$/.test(url.trim())) {
    return url.trim();
  }

  const listMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (listMatch) {
    return listMatch[1];
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = body?.url;

    if (!url) {
      return NextResponse.json({ error: 'YouTube playlist URL or ID is required' }, { status: 400 });
    }

    const playlistId = extractPlaylistId(url);
    if (!playlistId) {
      return NextResponse.json(
        { error: 'Invalid YouTube playlist URL or ID' },
        { status: 400 }
      );
    }

    const playlist = await getPlaylistDetails(playlistId);

    const savedPlaylist: Playlist = {
      ...playlist,
      id: `yt-pl-${playlistId}-${Date.now()}`,
      source: 'youtube',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return NextResponse.json({
      success: true,
      playlist: savedPlaylist,
    });
  } catch (error: any) {
    console.error('YouTube import error:', error);
    return NextResponse.json(
      { error: 'Failed to import YouTube playlist', message: error?.message || String(error) },
      { status: 500 }
    );
  }
}
