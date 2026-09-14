import { NextRequest, NextResponse } from 'next/server';
import { parseSpotifyUrl, fetchSpotifyEntity, mapSpotifyTrackToYouTube } from '@/lib/spotify';
import type { Track, Playlist } from '@/types/music';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = body?.url;

    if (!url) {
      return NextResponse.json({ error: 'Spotify URL is required' }, { status: 400 });
    }

    const parsed = parseSpotifyUrl(url);
    if (!parsed) {
      return NextResponse.json(
        { error: 'Invalid Spotify URL. Please provide a valid playlist, album, or track link.' },
        { status: 400 }
      );
    }

    const entity = await fetchSpotifyEntity(parsed.type, parsed.id);
    const mappedTracks: Track[] = [];

    // Map tracks concurrently with a concurrency limit of 5 to avoid overwhelming
    const BATCH_SIZE = 5;
    for (let i = 0; i < entity.tracks.length; i += BATCH_SIZE) {
      const batch = entity.tracks.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (spTrack) => {
          try {
            const mapped = await mapSpotifyTrackToYouTube(spTrack);
            if (mapped) {
              return {
                ...mapped,
                spotifyId: spTrack.id,
                album: spTrack.album || mapped.album,
                thumbnail: spTrack.thumbnail || mapped.thumbnail,
              };
            }
          } catch (e) {
            console.warn(`Failed to map Spotify track: ${spTrack.title}`, e);
          }
          return null;
        })
      );

      for (const res of batchResults) {
        if (res) mappedTracks.push(res);
      }
    }

    const playlist: Playlist = {
      id: `spotify-${parsed.type}-${parsed.id}-${Date.now()}`,
      title: entity.title,
      description: entity.description || `Imported Spotify ${parsed.type}`,
      author: entity.author,
      thumbnail: entity.thumbnail,
      trackCount: mappedTracks.length,
      tracks: mappedTracks,
      source: 'spotify',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return NextResponse.json({
      success: true,
      playlist,
      totalSpotifyTracks: entity.tracks.length,
      mappedCount: mappedTracks.length,
    });
  } catch (error: unknown) {
    console.error('Spotify import error:', error);
    return NextResponse.json(
      { error: 'Failed to import Spotify playlist', message: (error as Error)?.message || String(error) },
      { status: 500 }
    );
  }
}
