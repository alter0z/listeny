'use client';

import React from 'react';
import { X, Play, Trash2, Music, Sparkles } from 'lucide-react';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { AudioVisualizer } from '@/components/AudioVisualizer';

export function QueueDrawer() {
  const {
    queue,
    queueIndex,
    currentTrack,
    isPlaying,
    isQueueOpen,
    setIsQueueOpen,
    playTrack,
    removeFromQueue,
    clearQueue,
  } = useAudioPlayer();

  if (!isQueueOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-45 w-80 md:w-96 bg-[#0e0e13]/95 backdrop-blur-2xl border-l border-[#1f1f2a] flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 select-none pb-24">
      {/* Header */}
      <div className="p-5 flex items-center justify-between border-b border-[#1b1b24]">
        <div className="flex items-center gap-2.5">
          <Music className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-base text-white">Play Queue</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            {queue.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {queue.length > 1 && (
            <button
              onClick={clearQueue}
              className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="Clear Queue"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsQueueOpen(false)}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Now Playing Section */}
      {currentTrack && (
        <div className="p-4 border-b border-[#1b1b24] bg-emerald-500/5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            Now Playing
          </span>
          <div className="flex items-center gap-3 mt-2.5">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-md">
              <img
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-6 h-4 flex items-end justify-between px-1">
                    <span className="w-1 bg-emerald-400 h-full animate-pulse" />
                    <span className="w-1 bg-emerald-400 h-2/3 animate-pulse" />
                    <span className="w-1 bg-emerald-400 h-4/5 animate-pulse" />
                  </div>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{currentTrack.title}</p>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5">{currentTrack.artist}</p>
            </div>
          </div>
        </div>
      )}

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-2 py-1 block">
          Next in Queue
        </span>

        {queue.length <= 1 || queueIndex >= queue.length - 1 ? (
          <div className="text-center py-12 px-4 text-xs text-zinc-500">
            Queue is empty. Add songs from search or explore to queue up next tracks.
          </div>
        ) : (
          queue.map((track, idx) => {
            // Only show tracks after the current index
            if (idx <= queueIndex) return null;

            return (
              <div
                key={`${track.id}-${idx}`}
                className="group flex items-center justify-between p-2 rounded-xl hover:bg-[#181822] transition-colors"
              >
                <div
                  onClick={() => playTrack(track, queue)}
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                >
                  <div className="relative w-10 h-10 rounded-lg bg-[#1a1a24] overflow-hidden shrink-0">
                    <img
                      src={track.thumbnail}
                      alt={track.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Play className="w-4 h-4 fill-white text-white" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-zinc-200 group-hover:text-emerald-400 truncate transition-colors">
                      {track.title}
                    </p>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                      {track.artist}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => removeFromQueue(idx)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all ml-2"
                  title="Remove from queue"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
