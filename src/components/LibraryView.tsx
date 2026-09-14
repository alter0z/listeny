'use client';

import React, { useEffect, useState } from 'react';
import {
  Heart,
  Disc3,
  DownloadCloud,
  History,
  Play,
  Trash2,
  Sparkles,
  ArrowDownToLine,
  Music2,
  HardDrive,
} from 'lucide-react';
import type { Track, Playlist } from '@/types/music';
import {
  getFavoriteTracks,
  getSavedPlaylists,
  getOfflineTracksIndex,
  getPlayHistory,
  deletePlaylist,
  removeTrackOffline,
  toggleFavoriteTrack,
} from '@/lib/storage';
import { useAudioPlayer } from '@/context/AudioPlayerContext';

interface LibraryViewProps {
  initialTab?: 'favorites' | 'playlists' | 'downloads' | 'history';
  onSelectPlaylist: (playlist: Playlist) => void;
  onOpenImport: () => void;
}

export function LibraryView({
  initialTab = 'favorites',
  onSelectPlaylist,
  onOpenImport,
}: LibraryViewProps) {
  const [activeTab, setActiveTab] = useState<'favorites' | 'playlists' | 'downloads' | 'history'>(
    initialTab
  );
  const [favorites, setFavorites] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [downloads, setDownloads] = useState<Track[]>([]);
  const [history, setHistory] = useState<Track[]>([]);

  const { playTrack, currentTrack, addToQueue } = useAudioPlayer();

  const loadData = async () => {
    const [favs, pls, downs, hist] = await Promise.all([
      getFavoriteTracks(),
      getSavedPlaylists(),
      getOfflineTracksIndex(),
      getPlayHistory(),
    ]);
    setFavorites(favs);
    setPlaylists(pls);
    setDownloads(downs);
    setHistory(hist);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleDeletePlaylist = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = await deletePlaylist(id);
    setPlaylists(updated);
  };

  const handleRemoveOffline = async (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await removeTrackOffline(trackId);
    setDownloads((prev) => prev.filter((t) => t.id !== trackId));
  };

  const handleRemoveFavorite = async (track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFavoriteTrack(track);
    setFavorites((prev) => prev.filter((t) => t.id !== track.id));
  };

  return (
    <div className="flex-1 overflow-y-auto pb-28 px-6 lg:px-10 py-8 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Your Library</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Access your favorites, imported playlists, play history, and offline storage
          </p>
        </div>

        <button
          onClick={onOpenImport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-black text-xs font-bold shadow-lg shadow-emerald-500/20 hover:opacity-95 active:scale-95 transition-all"
        >
          <Sparkles className="w-4 h-4 stroke-[2.5]" />
          <span>Import Playlist</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1f1f2a] pb-4 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'favorites'
              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              : 'text-zinc-400 hover:text-white hover:bg-[#14141c]'
          }`}
        >
          <Heart className="w-4 h-4 fill-current" />
          <span>Favorites ({favorites.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('playlists')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'playlists'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-zinc-400 hover:text-white hover:bg-[#14141c]'
          }`}
        >
          <Disc3 className="w-4 h-4" />
          <span>Playlists ({playlists.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('downloads')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'downloads'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
              : 'text-zinc-400 hover:text-white hover:bg-[#14141c]'
          }`}
        >
          <DownloadCloud className="w-4 h-4" />
          <span>Offline Storage ({downloads.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'history'
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              : 'text-zinc-400 hover:text-white hover:bg-[#14141c]'
          }`}
        >
          <History className="w-4 h-4" />
          <span>History ({history.length})</span>
        </button>
      </div>

      {/* 1. Favorites Tab */}
      {activeTab === 'favorites' && (
        <div>
          {favorites.length === 0 ? (
            <div className="text-center py-20 text-zinc-500">
              <Heart className="w-12 h-12 mx-auto mb-3 text-zinc-600 stroke-[1.5]" />
              <h3 className="text-sm font-semibold text-zinc-300">No favorite songs yet</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Heart any song while playing or searching to find it quickly here.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => playTrack(favorites[0], favorites)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shadow-md shadow-emerald-500/20"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Play All ({favorites.length})</span>
                </button>
              </div>

              <div className="space-y-1">
                {favorites.map((track, idx) => {
                  const isCurrent = currentTrack?.id === track.id;
                  return (
                    <div
                      key={`${track.id}-${idx}`}
                      className={`group flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#14141c] transition-colors border border-transparent hover:border-white/5 ${
                        isCurrent ? 'bg-emerald-500/10 border-emerald-500/20' : ''
                      }`}
                    >
                      <div
                        onClick={() => playTrack(track, favorites)}
                        className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                      >
                        <span className="w-6 text-center text-xs text-zinc-500 font-mono">
                          {idx + 1}
                        </span>
                        <div className="relative w-10 h-10 rounded-xl bg-[#181820] overflow-hidden shrink-0">
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
                          <p className="text-xs text-zinc-400 truncate mt-0.5">{track.artist}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono text-zinc-500 mr-2">
                          {track.durationFormatted || '3:30'}
                        </span>
                        <button
                          onClick={(e) => handleRemoveFavorite(track, e)}
                          className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                          title="Remove from favorites"
                        >
                          <Heart className="w-4 h-4 fill-rose-500" />
                        </button>
                        <a
                          href={`/api/download/${track.id}?title=${encodeURIComponent(
                            track.title
                          )}&artist=${encodeURIComponent(track.artist)}`}
                          download={`${track.artist} - ${track.title}.mp3`}
                          className="p-2 text-zinc-500 hover:text-emerald-400 hover:bg-white/5 rounded-xl transition-colors"
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
        </div>
      )}

      {/* 2. Playlists Tab */}
      {activeTab === 'playlists' && (
        <div>
          {playlists.length === 0 ? (
            <div className="text-center py-20 text-zinc-500">
              <Disc3 className="w-12 h-12 mx-auto mb-3 text-zinc-600 stroke-[1.5]" />
              <h3 className="text-sm font-semibold text-zinc-300">No playlists saved yet</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Use the Import Playlist tool to bridge any Spotify or YouTube playlist into your library.
              </p>
              <button
                onClick={onOpenImport}
                className="mt-4 px-4 py-2 bg-emerald-500 text-black text-xs font-bold rounded-xl"
              >
                Import from Spotify / YouTube
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => onSelectPlaylist(pl)}
                  className="group bg-[#121217] hover:bg-[#181822] border border-[#1e1e28] hover:border-emerald-500/30 rounded-2xl p-3.5 transition-all duration-200 cursor-pointer shadow-md relative"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-[#181820] mb-3">
                    {pl.thumbnail ? (
                      <img
                        src={pl.thumbnail}
                        alt={pl.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Disc3 className="w-10 h-10 text-zinc-600" />
                      </div>
                    )}
                    <button
                      onClick={(e) => handleDeletePlaylist(pl.id, e)}
                      className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md"
                      title="Delete playlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="text-sm font-semibold text-zinc-100 truncate group-hover:text-emerald-400 transition-colors">
                    {pl.title}
                  </h4>
                  <div className="flex items-center justify-between mt-1 text-xs text-zinc-500">
                    <span className="capitalize">{pl.source || 'custom'}</span>
                    <span>{pl.tracks?.length || 0} tracks</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Downloads / Offline Storage Tab */}
      {activeTab === 'downloads' && (
        <div>
          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HardDrive className="w-5 h-5 text-cyan-400" />
              <div>
                <h4 className="text-xs font-bold text-white">Browser Offline Storage Active</h4>
                <p className="text-[11px] text-zinc-400">
                  {downloads.length} tracks cached in IndexedDB. Fully playable without network connection!
                </p>
              </div>
            </div>

            {downloads.length > 0 && (
              <button
                onClick={() => playTrack(downloads[0], downloads)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>Play Offline Queue</span>
              </button>
            )}
          </div>

          {downloads.length === 0 ? (
            <div className="text-center py-20 text-zinc-500">
              <DownloadCloud className="w-12 h-12 mx-auto mb-3 text-zinc-600 stroke-[1.5]" />
              <h3 className="text-sm font-semibold text-zinc-300">No offline downloads yet</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Click the cloud icon on any track or player bar to cache the audio directly into your browser for offline playback.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {downloads.map((track, idx) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <div
                    key={`${track.id}-${idx}`}
                    className={`group flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#14141c] transition-colors border border-transparent hover:border-white/5 ${
                      isCurrent ? 'bg-emerald-500/10 border-emerald-500/20' : ''
                    }`}
                  >
                    <div
                      onClick={() => playTrack(track, downloads)}
                      className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                    >
                      <span className="w-6 text-center text-xs text-zinc-500 font-mono">
                        {idx + 1}
                      </span>
                      <div className="relative w-10 h-10 rounded-xl bg-[#181820] overflow-hidden shrink-0">
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
                        <p className="text-xs text-zinc-400 truncate mt-0.5">{track.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 mr-2">
                        CACHED
                      </span>
                      <button
                        onClick={(e) => handleRemoveOffline(track.id, e)}
                        className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                        title="Remove offline copy"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Play History Tab */}
      {activeTab === 'history' && (
        <div>
          {history.length === 0 ? (
            <div className="text-center py-20 text-zinc-500">
              <History className="w-12 h-12 mx-auto mb-3 text-zinc-600 stroke-[1.5]" />
              <h3 className="text-sm font-semibold text-zinc-300">No play history yet</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Songs you listen to will automatically appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {history.map((track, idx) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <div
                    key={`${track.id}-${idx}`}
                    className={`group flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#14141c] transition-colors border border-transparent hover:border-white/5 ${
                      isCurrent ? 'bg-emerald-500/10 border-emerald-500/20' : ''
                    }`}
                  >
                    <div
                      onClick={() => playTrack(track, history)}
                      className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                    >
                      <span className="w-6 text-center text-xs text-zinc-500 font-mono">
                        {idx + 1}
                      </span>
                      <div className="relative w-10 h-10 rounded-xl bg-[#181820] overflow-hidden shrink-0">
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
                        <p className="text-xs text-zinc-400 truncate mt-0.5">{track.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => addToQueue(track)}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                        title="Add to queue"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
