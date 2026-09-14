import vm from 'node:vm';
import { Innertube, UniversalCache, Platform, ClientType } from 'youtubei.js';
import type { Track, Album, Artist, Playlist, HomeData, HomeSection } from '@/types/music';

// Initialize the Platform evaluator using Node.js VM
Platform.shim.eval = async (data: any, env: any = {}) => {
  const code = typeof data === 'string' ? data : data?.output || '';
  const context = {
    ...env,
    console,
    URL,
    URLSearchParams,
  };
  return vm.runInNewContext(`(function() { ${code} })()`, context);
};

let innertubeInstance: Innertube | null = null;
let initPromise: Promise<Innertube> | null = null;

let iosInnertubeInstance: Innertube | null = null;
let iosInitPromise: Promise<Innertube> | null = null;

export async function getInnertube(): Promise<Innertube> {
  if (innertubeInstance) return innertubeInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const yt = await Innertube.create({
        cache: new UniversalCache(false),
        generate_session_locally: true,
      });
      innertubeInstance = yt;
      return yt;
    } catch (err) {
      console.error('Failed to initialize Innertube (default):', err);
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
}

export async function getInnertubeIos(): Promise<Innertube> {
  if (iosInnertubeInstance) return iosInnertubeInstance;
  if (iosInitPromise) return iosInitPromise;

  iosInitPromise = (async () => {
    try {
      const yt = await Innertube.create({
        cache: new UniversalCache(false),
        generate_session_locally: true,
        client_type: ClientType.IOS,
      });
      iosInnertubeInstance = yt;
      return yt;
    } catch (err) {
      console.error('Failed to initialize Innertube (IOS):', err);
      iosInitPromise = null;
      throw err;
    }
  })();

  return iosInitPromise;
}

export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function extractBestThumbnail(thumbnails?: any[]): string {
  if (!thumbnails || thumbnails.length === 0) return '/default-cover.png';
  // Sort by width descending or pick last item
  const sorted = [...thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0));
  return sorted[0]?.url || thumbnails[thumbnails.length - 1]?.url || '/default-cover.png';
}

/**
 * Searches music using YouTube Music Innertube API.
 */
export async function searchMusic(query: string, type?: 'song' | 'album' | 'artist' | 'playlist') {
  const yt = await getInnertube();

  const songs: Track[] = [];
  const albums: Album[] = [];
  const artists: Artist[] = [];
  const playlists: Playlist[] = [];

  try {
    if (type) {
      const results = await yt.music.search(query, { type });
      const items = (results as any).contents?.[0]?.contents || (results as any).songs?.contents || (results as any).contents || [];

      for (const item of items) {
        parseSearchItem(item, type, songs, albums, artists, playlists);
      }
    } else {
      // General search across categories
      const results = await yt.music.search(query);

      // Check songs
      if ((results as any).songs?.contents) {
        for (const item of (results as any).songs.contents) {
          parseSearchItem(item, 'song', songs, albums, artists, playlists);
        }
      }
      // Check albums
      if ((results as any).albums?.contents) {
        for (const item of (results as any).albums.contents) {
          parseSearchItem(item, 'album', songs, albums, artists, playlists);
        }
      }
      // Check artists
      if ((results as any).artists?.contents) {
        for (const item of (results as any).artists.contents) {
          parseSearchItem(item, 'artist', songs, albums, artists, playlists);
        }
      }
      // Check playlists
      if ((results as any).community_playlists?.contents || (results as any).playlists?.contents) {
        const plItems = (results as any).community_playlists?.contents || (results as any).playlists?.contents || [];
        for (const item of plItems) {
          parseSearchItem(item, 'playlist', songs, albums, artists, playlists);
        }
      }

      // If categories were not split, process top result & mixed items
      if (songs.length === 0 && (results as any).contents) {
        for (const section of (results as any).contents) {
          if (section.contents) {
            for (const item of section.contents) {
              parseSearchItem(item, undefined, songs, albums, artists, playlists);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Search error in Innertube:', err);
  }

  return { query, songs, albums, artists, playlists };
}

function parseSearchItem(
  item: any,
  explicitType: string | undefined,
  songs: Track[],
  albums: Album[],
  artists: Artist[],
  playlists: Playlist[]
) {
  if (!item) return;

  const itemType = explicitType || item.type || (item.id && item.duration ? 'song' : 'playlist');
  const title = item.title?.text || (typeof item.title === 'string' ? item.title : '') || item.name?.text || item.name || '';
  const id = item.id || item.video_id || item.playlist_id || item.browse_id || '';
  const thumbnail = extractBestThumbnail(item.thumbnails || item.thumbnail?.thumbnails);

  if (!id || !title) return;

  if (itemType === 'song' || item.type === 'MusicResponsiveListItem' || item.type === 'Song') {
    const artist = item.artists?.[0]?.name || item.author?.name || item.authors?.[0]?.name || (typeof item.artists === 'string' ? item.artists : 'Unknown Artist');
    const artistId = item.artists?.[0]?.id || item.author?.id;
    const album = item.album?.name;
    const albumId = item.album?.id;
    const duration = item.duration?.seconds || (typeof item.duration === 'number' ? item.duration : 0);

    songs.push({
      id,
      title,
      artist,
      artistId,
      album,
      albumId,
      duration,
      durationFormatted: formatDuration(duration),
      thumbnail,
      source: 'youtube',
    });
  } else if (itemType === 'album' || item.type === 'Album') {
    const artist = item.artists?.[0]?.name || item.author?.name || 'Unknown Artist';
    const artistId = item.artists?.[0]?.id;
    const year = item.year?.text || item.year;

    albums.push({
      id,
      title,
      artist,
      artistId,
      year: year ? String(year) : undefined,
      thumbnail,
      tracks: [],
    });
  } else if (itemType === 'artist' || item.type === 'Artist') {
    const subscribers = item.subscribers?.text || item.subscribers;

    artists.push({
      id,
      name: title,
      thumbnail,
      subscribers: subscribers ? String(subscribers) : undefined,
    });
  } else if (itemType === 'playlist' || item.type === 'Playlist') {
    const author = item.author?.name || item.authors?.[0]?.name || 'YouTube Music';
    const trackCount = item.item_count ? parseInt(item.item_count, 10) : undefined;

    playlists.push({
      id,
      title,
      description: item.description?.text || item.description,
      thumbnail,
      author,
      trackCount,
      tracks: [],
      source: 'youtube',
    });
  }
}

/**
 * Resolves an audio stream URL for a given YouTube video ID.
 * Prefers muxed (video+audio, itag 18) formats because YouTube's CDN allows full
 * unthrottled downloads and range requests for muxed formats, whereas adaptive audio-only
 * formats often return 403 Forbidden on the web remix client.
 */
export async function resolveAudioStreamUrl(videoId: string): Promise<{ url: string; mimeType: string; contentLength?: number }> {
  // Strategy 1: YouTube Music getInfo - try muxed video+audio format first (itag 18)
  try {
    const yt = await getInnertube();
    const info = await yt.music.getInfo(videoId);

    // Prefer muxed format (itag 18 / 360p video+audio) which supports full range requests without 403
    let format = info.chooseFormat({ type: 'video+audio', quality: 'best' });

    // If not found via chooseFormat, check formats list explicitly
    if (!format && info.streaming_data?.formats) {
      format = info.streaming_data.formats.find((f: any) => f.itag === 18) || info.streaming_data.formats[0];
    }

    // Fall back to audio-only if muxed isn't present
    if (!format) {
      format = info.chooseFormat({ type: 'audio', quality: 'best' });
    }

    if (format) {
      const decipheredUrl = format.url || await format.decipher(yt.session.player);
      if (decipheredUrl && typeof decipheredUrl === 'string') {
        return {
          url: decipheredUrl,
          mimeType: format.mime_type || 'audio/mp4',
          contentLength: format.content_length,
        };
      }
    }
  } catch (err) {
    // console.warn(`YT Music resolution failed for ${videoId}, falling back...`);
  }

  // Strategy 2: iOS client getBasicInfo (Best for standard videos avoiding cypher issues)
  try {
    const ytIos = await getInnertubeIos();
    const info = await ytIos.getBasicInfo(videoId);

    // Try muxed format first, then audio
    let format = info.chooseFormat({ type: 'video+audio', quality: 'best' });
    if (!format) {
      format = info.chooseFormat({ type: 'audio', quality: 'best' });
    }

    if (format) {
      const decipheredUrl = format.url || await format.decipher(ytIos.session.player);
      if (decipheredUrl && typeof decipheredUrl === 'string') {
        return {
          url: decipheredUrl,
          mimeType: format.mime_type || 'audio/mp4',
          contentLength: format.content_length,
        };
      }
    }
  } catch (err) {
    // console.warn(`iOS client fallback failed for ${videoId}, trying default info...`);
  }

  // Strategy 3: Default client getBasicInfo (Last resort fallback)
  const yt = await getInnertube();
  const info = await yt.getBasicInfo(videoId);
  let audioFormat = info.chooseFormat({ type: 'video+audio', quality: 'best' });
  if (!audioFormat) {
    audioFormat = info.chooseFormat({ type: 'audio', quality: 'best' });
  }

  if (!audioFormat) {
    throw new Error(`No suitable audio format found for video ${videoId}`);
  }

  const decipheredUrl = audioFormat.url || await audioFormat.decipher(yt.session.player);
  if (!decipheredUrl || typeof decipheredUrl !== 'string') {
    throw new Error(`Failed to decipher stream URL for video ${videoId}`);
  }

  return {
    url: decipheredUrl,
    mimeType: audioFormat.mime_type || 'audio/mp4',
    contentLength: audioFormat.content_length,
  };
}

/**
 * Fetches home feed / explore content.
 */
export async function getHomeFeedData(): Promise<HomeData> {
  const yt = await getInnertube();
  const quickPicks: Track[] = [];
  const sections: HomeSection[] = [];

  try {
    const home = await yt.music.getHomeFeed();
    const rawSections = (home.sections as any) || [];

    for (const section of rawSections) {
      const sectionTitle = section.header?.title?.text || section.title?.text || 'Featured';
      const items: HomeSection['items'] = [];
      const sectionTracks: Track[] = [];
      const sectionPlaylists: Playlist[] = [];

      if (section.contents) {
        for (const item of (section.contents as any[])) {
          const title = item.title?.text || (typeof item.title === 'string' ? item.title : '') || item.name?.text || '';
          const id = item.id || item.video_id || item.playlist_id || item.browse_id || '';
          const thumbnail = extractBestThumbnail(item.thumbnails || item.thumbnail?.thumbnails);

          if (!id || !title) continue;

          if (item.type === 'MusicResponsiveListItem' || item.duration) {
            const artist = item.artists?.[0]?.name || item.author?.name || 'Unknown Artist';
            const duration = item.duration?.seconds || 0;
            const track: Track = {
              id,
              title,
              artist,
              duration,
              durationFormatted: formatDuration(duration),
              thumbnail,
              source: 'youtube',
            };

            if (quickPicks.length < 12) {
              quickPicks.push(track);
            }

            sectionTracks.push(track);

            items.push({
              type: 'song',
              id,
              title,
              subtitle: artist,
              thumbnail,
              itemData: track,
            });
          } else {
            const subtitle = item.subtitle?.text || item.author?.name || item.artists?.[0]?.name || 'Playlist';
            const playlist: Playlist = {
              id,
              title,
              description: subtitle,
              thumbnail,
              tracks: [],
              source: 'youtube',
            };

            sectionPlaylists.push(playlist);

            items.push({
              type: 'playlist',
              id,
              title,
              subtitle,
              thumbnail,
              itemData: playlist,
            });
          }
        }
      }

      if (items.length > 0) {
        sections.push({
          title: sectionTitle,
          tracks: sectionTracks.length > 0 ? sectionTracks : undefined,
          playlists: sectionPlaylists.length > 0 ? sectionPlaylists : undefined,
          items,
        });
      }
    }
  } catch (err) {
    console.error('Error fetching home feed:', err);
  }

  // If quickPicks empty, fill with fallback search for trending music
  if (quickPicks.length === 0) {
    try {
      const fallbackSearch = await searchMusic('Top Hits 2025', 'song');
      quickPicks.push(...fallbackSearch.songs.slice(0, 10));
    } catch (e) {
      console.error('Fallback quick picks error:', e);
    }
  }

  return { quickPicks, sections };
}

/**
 * Fetches playlist details and tracks.
 */
export async function getPlaylistDetails(playlistId: string): Promise<Playlist> {
  const yt = await getInnertube();
  const playlist = await yt.music.getPlaylist(playlistId);

  const title = (playlist.header as any)?.title?.text || (playlist as any).info?.title || 'Playlist';
  const description = (playlist.header as any)?.description?.text || (playlist as any).info?.description;
  const author = (playlist.header as any)?.author?.name || (playlist as any).info?.author?.name;
  const thumbnail = extractBestThumbnail((playlist.header as any)?.thumbnails || (playlist as any).info?.thumbnails);

  const tracks: Track[] = [];
  const items = ((playlist as any).items || (playlist as any).contents || []) as any[];

  for (const item of items) {
    const id = item.id || item.video_id;
    const trackTitle = item.title?.text || (typeof item.title === 'string' ? item.title : '') || item.name?.text || '';
    if (!id || !trackTitle) continue;

    const artist = item.artists?.[0]?.name || item.author?.name || 'Unknown Artist';
    const album = item.album?.name;
    const duration = item.duration?.seconds || 0;
    const trackThumb = extractBestThumbnail(item.thumbnails || item.thumbnail?.thumbnails) || thumbnail;

    tracks.push({
      id,
      title: trackTitle,
      artist,
      album,
      duration,
      durationFormatted: formatDuration(duration),
      thumbnail: trackThumb,
      source: 'youtube',
    });
  }

  return {
    id: playlistId,
    title,
    description,
    author,
    thumbnail,
    trackCount: tracks.length,
    tracks,
    source: 'youtube',
  };
}

/**
 * Fetches album details and tracks.
 */
export async function getAlbumDetails(albumId: string): Promise<Album> {
  const yt = await getInnertube();
  const album = await yt.music.getAlbum(albumId);

  const title = (album.header as any)?.title?.text || (album as any).title || 'Album';
  const artist = (album.header as any)?.artists?.[0]?.name || (album as any).artists?.[0]?.name || 'Unknown Artist';
  const artistId = (album.header as any)?.artists?.[0]?.id;
  const year = (album.header as any)?.year?.text || (album as any).year;
  const thumbnail = extractBestThumbnail((album.header as any)?.thumbnails || (album as any).thumbnails);

  const tracks: Track[] = [];
  const items = album.contents || [];

  for (const item of items) {
    const id = (item as any).id || (item as any).video_id;
    const trackTitle = (item as any).title?.text || (typeof (item as any).title === 'string' ? (item as any).title : '');
    if (!id || !trackTitle) continue;

    const duration = (item as any).duration?.seconds || 0;

    tracks.push({
      id,
      title: trackTitle,
      artist,
      artistId,
      album: title,
      albumId,
      duration,
      durationFormatted: formatDuration(duration),
      thumbnail,
      source: 'youtube',
    });
  }

  return {
    id: albumId,
    title,
    artist,
    artistId,
    year: year ? String(year) : undefined,
    thumbnail,
    tracks,
  };
}

/**
 * Fetches lyrics from YouTube Music or LRCLIB.
 */
export async function getLyricsData(videoId: string, title?: string, artist?: string, durationSec?: number) {
  // First try LRCLIB for synchronized lyrics
  if (title && artist) {
    try {
      const cleanTitle = encodeURIComponent(title.replace(/\([^)]*\)|\[[^\]]*\]/g, '').trim());
      const cleanArtist = encodeURIComponent(artist.trim());
      const durParam = durationSec && durationSec > 0 ? `&duration=${Math.round(durationSec)}` : '';

      const res = await fetch(`https://lrclib.net/api/get?track_name=${cleanTitle}&artist_name=${cleanArtist}${durParam}`, {
        headers: { 'User-Agent': 'MeldWeb/1.0 (https://github.com/FrancescoGrazioso/Meld)' },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.syncedLyrics) {
          const lines = parseLrc(data.syncedLyrics);
          if (lines.length > 0) {
            return {
              synced: lines,
              plain: data.plainLyrics || null,
              source: 'lrclib' as const,
            };
          }
        } else if (data.plainLyrics) {
          return {
            synced: null,
            plain: data.plainLyrics,
            source: 'lrclib' as const,
          };
        }
      }
    } catch (e) {
      console.warn('LRCLIB fetch error:', e);
    }
  }

  // Fallback to Innertube YouTube Music lyrics
  try {
    const yt = await getInnertube();
    const lyrics = await yt.music.getLyrics(videoId);
    if (lyrics?.description?.text) {
      return {
        synced: null,
        plain: lyrics.description.text,
        source: 'youtube' as const,
      };
    }
  } catch (e) {
    // YouTube music lyrics might not be available
  }

  return {
    synced: null,
    plain: null,
    source: 'none' as const,
  };
}

function parseLrc(lrcText: string): Array<{ time: number; text: string }> {
  const lines: Array<{ time: number; text: string }> = [];
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

  for (const line of lrcText.split('\n')) {
    const match = line.match(regex);
    if (match) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const ms = parseInt(match[3].padEnd(3, '0').substring(0, 3), 10);
      const time = min * 60 + sec + ms / 1000;
      const text = match[4].trim();
      lines.push({ time, text });
    }
  }

  return lines.sort((a, b) => a.time - b.time);
}

/**
 * Fetches durations for a list of YouTube video IDs via lightweight
 * `getBasicInfo` calls (batched with limited concurrency from YouTube,
 * tolerant of per-video failures). Used to enrich CSV imports which
 * don't carry duration metadata.
 */
export async function getVideoDurations(videoIds: string[]): Promise<Record<string, number>> {
  const yt = await getInnertube();
  const durations: Record<string, number> = {};

  // Cap enrichment cost for very large playlists
  const ids = videoIds.slice(0, 250);
  const BATCH_SIZE = 5;

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (id) => {
        try {
          const info = await yt.getBasicInfo(id);
          const duration = (info as any).basic_info?.duration;
          if (typeof duration === 'number' && duration > 0) {
            return { id, duration };
          }
        } catch (e) {
          console.warn(`Failed to fetch duration for ${id}:`, e);
        }
        return null;
      })
    );

    for (const res of results) {
      if (res) durations[res.id] = res.duration;
    }
  }

  return durations;
}
