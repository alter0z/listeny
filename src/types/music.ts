export interface Track {
  id: string; // YouTube Video ID
  title: string;
  artist: string;
  artistId?: string;
  album?: string;
  albumId?: string;
  duration: number; // in seconds
  durationFormatted?: string;
  thumbnail: string;
  streamUrl?: string;
  downloaded?: boolean;
  source?: 'youtube' | 'spotify' | 'custom';
  spotifyId?: string;
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  trackCount?: number;
  author?: string;
  tracks: Track[];
  source?: 'youtube' | 'spotify' | 'custom' | 'downloads' | 'favorites';
  createdAt?: number;
  updatedAt?: number;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  year?: string;
  thumbnail: string;
  tracks: Track[];
}

export interface Artist {
  id: string;
  name: string;
  thumbnail?: string;
  subscribers?: string;
  description?: string;
  topSongs?: Track[];
  albums?: Album[];
  singles?: Album[];
}

export interface SyncedLyricLine {
  time: number; // in seconds
  text: string;
}

export interface LyricsData {
  synced: SyncedLyricLine[] | null;
  plain: string | null;
  source?: 'lrclib' | 'youtube' | 'none';
}

export interface SearchResults {
  query: string;
  tracks?: Track[];
  songs: Track[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
}

export interface HomeSectionItem {
  type: 'song' | 'playlist' | 'album' | 'artist';
  id: string;
  title: string;
  subtitle?: string;
  thumbnail: string;
  itemData?: Track | Playlist | Album | Artist;
}

export interface HomeSection {
  title: string;
  subtitle?: string;
  tracks?: Track[];
  playlists?: Playlist[];
  items?: HomeSectionItem[];
}

export interface HomeData {
  quickPicks: Track[];
  sections: HomeSection[];
}

export interface SpotifyImportTrack {
  id: string;
  title: string;
  artist: string;
  durationMs: number;
  album?: string;
  thumbnail?: string;
  mappedTrack?: Track | null;
  status: 'pending' | 'mapping' | 'success' | 'failed';
}

export interface SpotifyImportResult {
  title: string;
  description?: string;
  thumbnail?: string;
  totalTracks: number;
  tracks: SpotifyImportTrack[];
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface PlayerSessionState {
  currentTrack: Track | null;
  currentTime: number;
  queue: Track[];
  queueIndex: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffle: boolean;
}

