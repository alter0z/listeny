'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Play,
  Shuffle,
  DownloadCloud,
  Heart,
  Plus,
  ArrowDownToLine,
  Trash2,
  Share2,
  Disc3,
  Sparkles,
  Loader2,
} from 'lucide-react';
import type { Playlist, Track } from '@/types/music';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { saveTrackOffline, toggleFavoriteTrack, savePlaylist, deletePlaylist } from '@/lib/storage';

interface PlaylistDetailViewProps {
  playlist: Playlist;
  onBack: () => void;
  onPlaylistUpdated?: () => void;
}

export function PlaylistDetailView({
  playlist,
  onBack,
  onPlaylistUpdated,
}: PlaylistDetailViewProps) {
  const [cachingAll, setCachingAll] = useState(false);
  const [cacheProgress, setCacheProgress] = useState(0);

  const { playTrack, addToQueue, currentTrack, isPlaying } = useAudioPlayer();

  const totalSeconds = playlist.tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  const totalMins = Math.floor(totalSeconds / 60);

  const handlePlayAll = (shuffle: boolean = false) => {
    if (playlist.tracks.length === 0) return;
    let list = [...playlist.tracks];
    if (shuffle) {
      list = list.sort(() => Math.random() - 0.5);
    }
    playTrack(list[0], list);
  };

  const handleCacheAll = async () => {
    if (cachingAll || playlist.tracks.length === 0) return;
    setCachingAll(true);
    setCacheProgress(0);

    for (let i = 0; i < playlist.tracks.length; i++) {
      const track = playlist.tracks[i];
      try {
        const res = await fetch(`/api/stream/${track.id}`);
        if (res.ok) {
          const blob = await res.blob();
          await saveTrackOffline(track, blob);
        }
      } catch (err) {
        console.warn(`Failed to cache track ${track.title}:`, err);
      }
      setCacheProgress(i + 1);
    }

    setCachingAll(false);
  };

  return (
    <div className="flex-1 overflow-y-auto pb-28 select-none">
      {/* Top Banner Header with Blurred Ambient Glow */}
      <div className="relative p-6 lg:p-10 bg-gradient-to-b from-emerald-950/40 via-[#101017] to-[#070709] border-b border-[#1c1c26]">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-semibold mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 lg:gap-8">
          <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl bg-[#181824] shadow-2xl shadow-black/80 overflow-hidden shrink-0 border border-white/10">
            {playlist.thumbnail ? (
              <img
                src={playlist.thumbnail}
                alt={playlist.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Disc3 className="w-16 h-16 text-zinc-600" />
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-2">
              <span>{playlist.source?.toUpperCase() || 'PLAYLIST'}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {playlist.title}
            </h1>

            <p className="text-xs sm:text-sm text-zinc-400 mt-2">
              {playlist.description || `Curated by ${playlist.author || 'Meld Web'}`}
            </p>

            <div className="flex items-center gap-2 mt-3 text-xs text-zinc-400 font-medium justify-center sm:justify-start">
              <span>{playlist.tracks.length} songs</span>
              <span>•</span>
              <span>About {totalMins} minutes</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-6 flex-wrap justify-center sm:justify-start">
              <button
                onClick={() => handlePlayAll(false)}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Play All</span>
              </button>

              <button
                onClick={() => handlePlayAll(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-colors"
              >
                <Shuffle className="w-4 h-4" />
                <span>Shuffle</span>
              </button>

              <button
                onClick={handleCacheAll}
                disabled={cachingAll}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-semibold border border-white/10 transition-colors disabled:opacity-50"
                title="Download all tracks for offline playback"
              >
                {cachingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>
                      Caching ({cacheProgress}/{playlist.tracks.length})
                    </span>
                  </>
                ) : (
                  <>
                    <DownloadCloud className="w-4 h-4" />
                    <span>Download All Offline</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tracklist Section */}
      <div className="px-6 lg:px-10 py-6">
        {playlist.tracks.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-sm">
            This playlist contains no tracks yet.
          </div>
        ) : (
          <div className="space-y-1">
            {playlist.tracks.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;

              return (
                <div
                  key={`${track.id}-${idx}`}
                  className={`group flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#14141c] transition-colors border border-transparent hover:border-white/5 ${
                    isCurrent ? 'bg-emerald-500/10 border-emerald-500/20' : ''
                  }`}
                >
                  <div
                    onClick={() => playTrack(track, playlist.tracks)}
                    className="flex items-center gap-4 min-w-0 flex-1 cursor-pointer"
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
                      <p className="text-xs text-zinc-400 truncate mt-0.5">{track.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono text-zinc-500 mr-2">
                      {track.durationFormatted ||
                        `${Math.floor(track.duration / 60)}:${(track.duration % 60)
                          .toString()
                          .padStart(2, '0')}`}
                    </span>

                    <button
                      onClick={() => addToQueue(track)}
                      className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                      title="Add to queue"
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => toggleFavoriteTrack(track)}
                      className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-white/5 rounded-xl transition-colors"
                      title="Favorite"
                    >
                      <Heart className="w-4 h-4" />
                    </button>

                    <a
                      href={`/api/download/${track.id}?title=${encodeURIComponent(
                        track.title
                      )}&artist=${encodeURIComponent(track.artist)}`}
                      download={`${track.artist} - ${track.title}.mp3`}
                      className="p-2 text-zinc-500 hover:text-emerald-400 hover:bg-white/5 rounded-xl transition-colors"
                      title="Download MP3"
                    >
                      <ArrowDownToLine className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
