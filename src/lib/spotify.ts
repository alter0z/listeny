import { searchMusic, formatDuration } from './innertube';
import { calculateMatchScore } from './fuzzy';
import type { Track, SpotifyImportResult, SpotifyImportTrack } from '@/types/music';

/**
 * Extracts Spotify ID and resource type from various URL formats:
 * - https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=...
 * - https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy
 * - spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
 */
export function parseSpotifyUrl(url: string): { type: 'playlist' | 'album' | 'track'; id: string } | null {
  if (!url) return null;

  // URI format spotify:playlist:xxx
  const uriMatch = url.match(/spotify:(playlist|album|track):([a-zA-Z0-9]+)/);
  if (uriMatch) {
    return {
      type: uriMatch[1] as 'playlist' | 'album' | 'track',
      id: uriMatch[2],
    };
  }

  // Web URL format
  const urlMatch = url.match(/open\.spotify\.com\/(playlist|album|track)\/([a-zA-Z0-9]+)/);
  if (urlMatch) {
    return {
      type: urlMatch[1] as 'playlist' | 'album' | 'track',
      id: urlMatch[2],
    };
  }

  return null;
}

/**
 * Fetches Spotify playlist or album metadata and track list via Spotify Embed API.
 */
export async function fetchSpotifyEntity(type: 'playlist' | 'album' | 'track', id: string): Promise<{
  title: string;
  description?: string;
  thumbnail?: string;
  author?: string;
  tracks: Array<{
    id: string;
    title: string;
    artist: string;
    durationMs: number;
    album?: string;
    thumbnail?: string;
  }>;
}> {
  const embedUrl = `https://open.spotify.com/embed/${type}/${id}`;
  const res = await fetch(embedUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Spotify embed: HTTP ${res.status}`);
  }

  const html = await res.text();
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/);

  if (!nextDataMatch) {
    throw new Error('Could not extract Spotify data from page.');
  }

  const json = JSON.parse(nextDataMatch[1]);
  const entity = json.props?.pageProps?.state?.data?.entity;

  if (!entity) {
    throw new Error('Spotify entity data is missing in response.');
  }

  const title = entity.name || entity.title || 'Imported Spotify Playlist';
  const description = entity.description || entity.subtitle || '';
  const author = entity.owner?.name || entity.artists?.[0]?.name || 'Spotify';
  const thumbnail = entity.coverArt?.sources?.[0]?.url || entity.images?.[0]?.url || '/default-cover.png';

  const rawTracks = entity.trackList || [];
  const tracks = rawTracks.map((t: any, index: number) => {
    // Artist names might be in subtitle "Artist1, Artist2" or artists array
    let artist = t.subtitle || (t.artists && t.artists.map((a: any) => a.name).join(', ')) || 'Unknown Artist';
    // Clean non-breaking spaces
    artist = artist.replace(/ /g, ' ').trim();

    return {
      id: t.uri ? t.uri.replace('spotify:track:', '') : `spotify-${index}`,
      title: t.title || t.name || 'Unknown Track',
      artist,
      durationMs: t.duration || t.duration_ms || 0,
      album: t.album?.name || title,
      thumbnail: t.coverArt?.sources?.[0]?.url || thumbnail,
    };
  });

  return {
    title,
    description,
    author,
    thumbnail,
    tracks,
  };
}

/**
 * Maps a single Spotify track to a YouTube Music track using fuzzy matching.
 */
export async function mapSpotifyTrackToYouTube(
  spotifyTrack: { title: string; artist: string; durationMs: number }
): Promise<Track | null> {
  const searchQuery = `${spotifyTrack.title} ${spotifyTrack.artist}`.trim();
  const searchResults = await searchMusic(searchQuery, 'song');

  if (!searchResults.songs || searchResults.songs.length === 0) {
    // Try general search if song filter yields nothing
    const generalResults = await searchMusic(searchQuery);
    if (!generalResults.songs || generalResults.songs.length === 0) {
      return null;
    }
    searchResults.songs = generalResults.songs;
  }

  let bestMatch: Track | null = null;
  let bestScore = -1;

  for (const candidate of searchResults.songs.slice(0, 8)) {
    const score = calculateMatchScore(
      spotifyTrack.title,
      spotifyTrack.artist,
      spotifyTrack.durationMs,
      candidate.title,
      candidate.artist,
      candidate.duration
    );

    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }

  // If score is reasonable (> 0.45) return best match, otherwise fallback to first result if close in duration
  if (bestScore >= 0.45 && bestMatch) {
    return bestMatch;
  }

  return searchResults.songs[0] || null;
}
