import { get, set, del, keys, createStore } from 'idb-keyval';
import type { Track, Playlist, LyricsData } from '@/types/music';

// IndexedDB stores
const audioStore = typeof window !== 'undefined' ? createStore('meld_audio_db', 'audio_blobs') : undefined;
const metaStore = typeof window !== 'undefined' ? createStore('meld_meta_db', 'app_data') : undefined;

const PLAYLISTS_KEY = 'meld_saved_playlists';
const FAVORITES_KEY = 'meld_favorite_tracks';
const HISTORY_KEY = 'meld_play_history';
const OFFLINE_INDEX_KEY = 'meld_offline_tracks_index';

// ================= PLAYLISTS =================

export async function getSavedPlaylists(): Promise<Playlist[]> {
  if (typeof window === 'undefined') return [];
  try {
    const playlists = (await get(PLAYLISTS_KEY, metaStore)) || [];
    return playlists;
  } catch (e) {
    console.error('Failed to get saved playlists:', e);
    return [];
  }
}

export async function savePlaylist(playlist: Playlist): Promise<Playlist[]> {
  if (typeof window === 'undefined') return [];
  try {
    const current = await getSavedPlaylists();
    const existingIndex = current.findIndex((p) => p.id === playlist.id);
    let updated: Playlist[];

    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = { ...playlist, updatedAt: Date.now() };
    } else {
      updated = [playlist, ...current];
    }

    await set(PLAYLISTS_KEY, updated, metaStore);
    return updated;
  } catch (e) {
    console.error('Failed to save playlist:', e);
    return [];
  }
}

export async function deletePlaylist(playlistId: string): Promise<Playlist[]> {
  if (typeof window === 'undefined') return [];
  try {
    const current = await getSavedPlaylists();
    const updated = current.filter((p) => p.id !== playlistId);
    await set(PLAYLISTS_KEY, updated, metaStore);
    return updated;
  } catch (e) {
    console.error('Failed to delete playlist:', e);
    return [];
  }
}

// ================= FAVORITES =================

export async function getFavoriteTracks(): Promise<Track[]> {
  if (typeof window === 'undefined') return [];
  try {
    const favorites = (await get(FAVORITES_KEY, metaStore)) || [];
    return favorites;
  } catch (e) {
    console.error('Failed to get favorites:', e);
    return [];
  }
}

export async function toggleFavoriteTrack(track: Track): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const favorites = await getFavoriteTracks();
    const exists = favorites.some((t) => t.id === track.id);
    let updated: Track[];

    if (exists) {
      updated = favorites.filter((t) => t.id !== track.id);
    } else {
      updated = [track, ...favorites];
    }

    await set(FAVORITES_KEY, updated, metaStore);
    return !exists;
  } catch (e) {
    console.error('Failed to toggle favorite:', e);
    return false;
  }
}

export async function isTrackFavorite(trackId: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const favorites = await getFavoriteTracks();
    return favorites.some((t) => t.id === trackId);
  } catch {
    return false;
  }
}

// ================= PLAY HISTORY =================

export async function getPlayHistory(): Promise<Track[]> {
  if (typeof window === 'undefined') return [];
  try {
    const history = (await get(HISTORY_KEY, metaStore)) || [];
    return history;
  } catch (e) {
    console.error('Failed to get history:', e);
    return [];
  }
}

export async function addToHistory(track: Track): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const history = await getPlayHistory();
    const filtered = history.filter((t) => t.id !== track.id);
    const updated = [track, ...filtered].slice(0, 100); // keep last 100
    await set(HISTORY_KEY, updated, metaStore);
  } catch (e) {
    console.error('Failed to add to history:', e);
  }
}

// ================= OFFLINE AUDIO CACHE =================

export async function getOfflineTracksIndex(): Promise<Track[]> {
  if (typeof window === 'undefined') return [];
  try {
    const index = (await get(OFFLINE_INDEX_KEY, metaStore)) || [];
    return index;
  } catch (e) {
    console.error('Failed to get offline index:', e);
    return [];
  }
}

export async function isTrackCachedOffline(trackId: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const audioBlob = await get(`audio_${trackId}`, audioStore);
    return !!audioBlob;
  } catch {
    return false;
  }
}

export async function saveTrackOffline(track: Track, audioBlob: Blob): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    // Save audio blob in IndexedDB
    await set(`audio_${track.id}`, audioBlob, audioStore);

    // Save in index
    const index = await getOfflineTracksIndex();
    const exists = index.some((t) => t.id === track.id);
    if (!exists) {
      const updated = [{ ...track, downloaded: true }, ...index];
      await set(OFFLINE_INDEX_KEY, updated, metaStore);
    }
  } catch (e) {
    console.error(`Failed to cache track ${track.id} offline:`, e);
    throw e;
  }
}

export async function getOfflineAudioUrl(trackId: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const blob: Blob | undefined = await get(`audio_${trackId}`, audioStore);
    if (blob) {
      return URL.createObjectURL(blob);
    }
    return null;
  } catch (e) {
    console.error(`Failed to get offline audio for ${trackId}:`, e);
    return null;
  }
}

export async function removeTrackOffline(trackId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await del(`audio_${trackId}`, audioStore);
    const index = await getOfflineTracksIndex();
    const updated = index.filter((t) => t.id !== trackId);
    await set(OFFLINE_INDEX_KEY, updated, metaStore);
  } catch (e) {
    console.error(`Failed to remove offline audio for ${trackId}:`, e);
  }
}

// ================= LYRICS CACHE =================

export async function getCachedLyrics(trackId: string): Promise<LyricsData | null> {
  if (typeof window === 'undefined') return null;
  try {
    const lyrics = await get(`lyrics_${trackId}`, metaStore);
    return lyrics || null;
  } catch {
    return null;
  }
}

export async function cacheLyrics(trackId: string, lyrics: LyricsData): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await set(`lyrics_${trackId}`, lyrics, metaStore);
  } catch (e) {
    console.error('Failed to cache lyrics:', e);
  }
}
