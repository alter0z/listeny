'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Play,
  Plus,
  Heart,
  DownloadCloud,
  ArrowDownToLine,
  Disc3,
  User,
  Music,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react';
import type { Track, Playlist, SearchResults } from '@/types/music';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { toggleFavoriteTrack, isTrackFavorite, saveTrackOffline, isTrackCachedOffline } from '@/lib/storage';

interface SearchViewProps {
  initialQuery?: string;
  onSelectPlaylist: (playlist: Playlist) => void;
}

export function SearchView({ initialQuery = '', onSelectPlaylist }: SearchViewProps) {
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<'all' | 'song' | 'playlist' | 'album'>('all');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());

  const { playTrack, addToQueue, currentTrack } = useAudioPlayer();

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery, filter);
    }
  }, [initialQuery]);

  const performSearch = async (searchQuery: string, searchFilter: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const typeParam = searchFilter === 'all' ? '' : `&type=${searchFilter}`;
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}${typeParam}`);
      if (res.ok) {
        const data: SearchResults = await res.json();
        setResults(data);

        // Check favorite and download status for returned tracks
        const favs = new Set<string>();
        const downs = new Set<string>();
        for (const track of data.tracks || []) {
          if (await isTrackFavorite(track.id)) favs.add(track.id);
          if (await isTrackCachedOffline(track.id)) downs.add(track.id);
        }
        setFavoriteIds(favs);
        setDownloadedIds(downs);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query, filter);
  };

  const handleFilterChange = (newFilter: 'all' | 'song' | 'playlist' | 'album') => {
    setFilter(newFilter);
    if (query.trim()) {
      performSearch(query, newFilter);
    }
  };

  const handleToggleFav = async (track: Track) => {
    const isNowFav = await toggleFavoriteTrack(track);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isNowFav) next.add(track.id);
      else next.delete(track.id);
      return next;
    });
  };

  const handleDownload = async (track: Track) => {
    try {
      const res = await fetch(`/api/stream/${track.id}`);
      if (!res.ok) throw new Error('Stream fetch failed');
      const blob = await res.blob();
      await saveTrackOffline(track, blob);
      setDownloadedIds((prev) => new Set(prev).add(track.id));
    } catch (err) {
      console.error('Download offline failed:', err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-28 px-6 lg:px-10 py-8 select-none">
      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="max-w-3xl mb-8">
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search songs, artists, albums, or Spotify/YouTube links..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-28 py-3.5 bg-[#121218] border border-[#232330] rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm shadow-xl transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults(null);
              }}
              className="absolute right-20 p-1.5 text-zinc-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
          {(['all', 'song', 'playlist', 'album'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => handleFilterChange(f)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                filter === f
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                  : 'bg-[#181822] text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              {f === 'all' ? 'All Results' : `${f}s`}
            </button>
          ))}
        </div>
      </form>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-500">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-xs font-medium">Searching high quality audio tracks...</p>
        </div>
      )}

      {/* No Results or Initial Prompt */}
      {!loading && !results && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-3xl bg-[#14141c] border border-white/5 flex items-center justify-center mx-auto mb-4 text-zinc-600">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-zinc-300">Find any song in seconds</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Search across millions of tracks, albums, playlists, or paste direct URLs to stream.
          </p>
        </div>
      )}

      {/* Search Results Display */}
      {!loading && results && (
        <div className="space-y-10">
          {/* Tracks Section */}
          {results.tracks && results.tracks.length > 0 && (
            <div>
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Music className="w-4 h-4 text-emerald-400" />
                <span>Songs</span>
              </h3>

              <div className="space-y-1">
                {results.tracks.map((track, idx) => {
                  const isCurrent = currentTrack?.id === track.id;
                  const isFav = favoriteIds.has(track.id);
                  const isDown = downloadedIds.has(track.id);

                  return (
                    <div
                      key={`${track.id}-${idx}`}
                      className={`group flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#14141c] transition-colors border border-transparent hover:border-white/5 ${
                        isCurrent ? 'bg-emerald-500/10 border-emerald-500/20' : ''
                      }`}
                    >
                      {/* Left: Play button & info */}
                      <div
                        onClick={() => playTrack(track, results.tracks)}
                        className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                      >
                        <span className="w-6 text-center text-xs text-zinc-500 font-mono">
                          {idx + 1}
                        </span>
                        <div className="relative w-11 h-11 rounded-xl bg-[#181820] overflow-hidden shrink-0 shadow-md">
                          <img
                            src={track.thumbnail}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Play className="w-4 h-4 fill-white text-white" />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-semibold truncate ${
                              isCurrent ? 'text-emerald-400' : 'text-zinc-100 group-hover:text-emerald-400'
                            }`}
                          >
                            {track.title}
                          </p>
                          <p className="text-xs text-zinc-400 truncate mt-0.5">
                            {track.artist} {track.album ? `• ${track.album}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono text-zinc-500 mr-2">
                          {track.durationFormatted || '3:30'}
                        </span>

                        <button
                          onClick={() => addToQueue(track)}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                          title="Add to queue"
                        >
                          <Plus className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleFav(track)}
                          className={`p-2 rounded-xl transition-colors ${
                            isFav
                              ? 'text-rose-500 hover:text-rose-400'
                              : 'text-zinc-500 hover:text-white hover:bg-white/5'
                          }`}
                          title={isFav ? 'Remove favorite' : 'Add to favorites'}
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500' : ''}`} />
                        </button>

                        <button
                          onClick={() => handleDownload(track)}
                          className={`p-2 rounded-xl transition-colors ${
                            isDown
                              ? 'text-emerald-400'
                              : 'text-zinc-500 hover:text-white hover:bg-white/5'
                          }`}
                          title={isDown ? 'Saved in browser offline' : 'Save offline to browser'}
                        >
                          <DownloadCloud className="w-4 h-4" />
                        </button>

                        <a
                          href={`/api/download/${track.id}?title=${encodeURIComponent(
                            track.title
                          )}&artist=${encodeURIComponent(track.artist)}`}
                          download={`${track.artist} - ${track.title}.mp3`}
                          className="p-2 text-zinc-500 hover:text-emerald-400 hover:bg-white/5 rounded-xl transition-colors"
                          title="Download MP3 file directly to computer"
                        >
                          <ArrowDownToLine className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Playlists & Albums Section */}
          {((results.playlists && results.playlists.length > 0) ||
            (results.albums && results.albums.length > 0)) && (
            <div>
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Disc3 className="w-4 h-4 text-emerald-400" />
                <span>Playlists & Albums</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[...(results.playlists || []), ...(results.albums || [])].map((item: any) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectPlaylist(item)}
                    className="group bg-[#121217] hover:bg-[#181822] border border-[#1e1e28] hover:border-emerald-500/30 rounded-2xl p-3 transition-all duration-200 cursor-pointer shadow-md"
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-[#181820] mb-2.5">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Disc3 className="w-10 h-10 text-zinc-600" />
                        </div>
                      )}
                    </div>
                    <h4 className="text-xs font-semibold text-zinc-100 truncate group-hover:text-emerald-400 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                      {item.author || item.artist || 'Album'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
