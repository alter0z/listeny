import { NextRequest, NextResponse } from 'next/server';
import { getPlaylistsForUser, savePlaylistForUser, deletePlaylistForUser } from '@/lib/db';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId') || request.headers.get('x-listeny-user') || 'default';

  try {
    const playlists = getPlaylistsForUser(userId);
    return NextResponse.json({ playlists });
  } catch (error: unknown) {
    console.error('Get playlists API error:', error);
    return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body.userId || request.headers.get('x-listeny-user') || 'default';
    const playlist = body.playlist;

    if (!playlist || !playlist.id || !playlist.title) {
      return NextResponse.json({ error: 'Valid playlist object is required' }, { status: 400 });
    }

    const updated = savePlaylistForUser(userId, playlist);
    return NextResponse.json({ playlists: updated });
  } catch (error: unknown) {
    console.error('Save playlist API error:', error);
    return NextResponse.json(
      { error: 'Failed to save playlist', message: (error as Error)?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId') || request.headers.get('x-listeny-user') || 'default';
  const playlistId = searchParams.get('playlistId');

  if (!playlistId) {
    return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 });
  }

  try {
    const updated = deletePlaylistForUser(userId, playlistId);
    return NextResponse.json({ playlists: updated });
  } catch (error: unknown) {
    console.error('Delete playlist API error:', error);
    return NextResponse.json({ error: 'Failed to delete playlist' }, { status: 500 });
  }
}
