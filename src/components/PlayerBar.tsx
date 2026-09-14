'use client';

import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
  Heart,
  DownloadCloud,
  ListMusic,
  Maximize2,
  Mic2,
  Activity,
  ArrowDownToLine,
  Loader2,
} from 'lucide-react';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { AudioVisualizer } from '@/components/AudioVisualizer';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffle,
    isFavorite,
    isDownloaded,
    isQueueOpen,
    isLyricsOpen,
    isVisualizerActive,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeatMode,
    toggleFavorite,
    toggleDownloadOffline,
    setIsFullscreenOpen,
    setIsQueueOpen,
    setIsLyricsOpen,
    setIsVisualizerActive,
  } = useAudioPlayer();

  if (!currentTrack) {
    return (
      <div className="h-20 bg-[#0c0c10]/90 backdrop-blur-xl border-t border-[#1e1e24] flex items-center justify-between px-6 select-none z-40">
        <div className="flex items-center gap-3 text-zinc-500 text-xs">
          <div className="w-11 h-11 rounded-lg bg-[#18181f] flex items-center justify-center">
            <Activity className="w-5 h-5 text-zinc-600" />
          </div>
          <span>Select a song or import a playlist to start listening</span>
        </div>
      </div>
    );
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="h-22 bg-[#0a0a0e]/95 backdrop-blur-2xl border-t border-[#1a1a22] flex items-center justify-between px-5 select-none relative z-40 shadow-2xl">
      {/* 1. Track Info (Left) */}
      <div className="flex items-center gap-3.5 min-w-[240px] max-w-[320px]">
        <div
          onClick={() => setIsFullscreenOpen(true)}
          className="relative w-13 h-13 rounded-xl overflow-hidden shadow-lg shadow-black/60 bg-[#16161d] shrink-0 cursor-pointer group"
        >
          <img
            src={currentTrack.thumbnail}
            alt={currentTrack.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Maximize2 className="w-4 h-4 text-white" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p
            onClick={() => setIsFullscreenOpen(true)}
            className="text-sm font-semibold text-zinc-100 hover:text-emerald-400 cursor-pointer truncate transition-colors"
          >
            {currentTrack.title}
          </p>
          <p className="text-xs text-zinc-400 truncate mt-0.5">
            {currentTrack.artist}
          </p>
        </div>

        {/* Favorite & Download Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={toggleFavorite}
            className={`p-2 rounded-lg transition-colors ${
              isFavorite
                ? 'text-rose-500 hover:text-rose-400'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-[#181822]'
            }`}
            title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500' : ''}`} />
          </button>

          <button
            onClick={toggleDownloadOffline}
            className={`p-2 rounded-lg transition-colors ${
              isDownloaded
                ? 'text-emerald-400 hover:text-emerald-300'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-[#181822]'
            }`}
            title={isDownloaded ? 'Cached Offline (Click to remove)' : 'Save Offline to Browser'}
          >
            <DownloadCloud className={`w-4 h-4 ${isDownloaded ? 'stroke-[2.5]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Main Playback Controls & Progress Slider (Center) */}
      <div className="flex flex-col items-center gap-1.5 flex-1 max-w-[620px] px-6">
        {/* Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleShuffle}
            className={`p-1.5 rounded-lg transition-colors ${
              isShuffle ? 'text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title={`Shuffle: ${isShuffle ? 'On' : 'Off'}`}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={prev}
            className="p-1.5 text-zinc-300 hover:text-white hover:scale-110 active:scale-95 transition-all"
            title="Previous track"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black flex items-center justify-center shadow-lg shadow-emerald-500/25 transition-all"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-black" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 fill-black text-black stroke-[2.5]" />
            ) : (
              <Play className="w-5 h-5 fill-black text-black ml-0.5 stroke-[2.5]" />
            )}
          </button>

          <button
            onClick={next}
            className="p-1.5 text-zinc-300 hover:text-white hover:scale-110 active:scale-95 transition-all"
            title="Next track"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={cycleRepeatMode}
            className={`p-1.5 rounded-lg transition-colors ${
              repeatMode !== 'off' ? 'text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-4 h-4" />
            ) : (
              <Repeat className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Progress Bar with Timers */}
        <div className="w-full flex items-center gap-3">
          <span className="text-[11px] font-mono text-zinc-500 w-10 text-right">
            {formatTime(currentTime)}
          </span>

          <div className="relative flex-1 flex items-center group h-4">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full h-1 bg-zinc-800 rounded-lg cursor-pointer accent-emerald-500 hover:h-1.5 transition-all"
            />
            {/* Filled highlight bar */}
            <div
              className="absolute left-0 top-1.5 h-1 group-hover:h-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg pointer-events-none transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <span className="text-[11px] font-mono text-zinc-500 w-10">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* 3. Secondary Controls (Right) */}
      <div className="flex items-center gap-3 min-w-[240px] justify-end">
        {/* Visualizer Toggle */}
        <button
          onClick={() => setIsVisualizerActive(!isVisualizerActive)}
          className={`p-2 rounded-lg transition-colors ${
            isVisualizerActive
              ? 'text-emerald-400 bg-emerald-500/10'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#161620]'
          }`}
          title="Toggle Audio Visualizer"
        >
          <Activity className="w-4 h-4" />
        </button>

        {/* Lyrics Toggle */}
        <button
          onClick={() => setIsLyricsOpen(!isLyricsOpen)}
          className={`p-2 rounded-lg transition-colors ${
            isLyricsOpen
              ? 'text-emerald-400 bg-emerald-500/10'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#161620]'
          }`}
          title="Synchronized Lyrics"
        >
          <Mic2 className="w-4 h-4" />
        </button>

        {/* Queue Toggle */}
        <button
          onClick={() => setIsQueueOpen(!isQueueOpen)}
          className={`p-2 rounded-lg transition-colors ${
            isQueueOpen
              ? 'text-emerald-400 bg-emerald-500/10'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#161620]'
          }`}
          title="Play Queue"
        >
          <ListMusic className="w-4 h-4" />
        </button>

        {/* Direct MP3 Download to Disk */}
        <a
          href={`/api/download/${currentTrack.id}?title=${encodeURIComponent(
            currentTrack.title
          )}&artist=${encodeURIComponent(currentTrack.artist)}`}
          download={`${currentTrack.artist} - ${currentTrack.title}.mp3`}
          className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-[#161620] rounded-lg transition-colors"
          title="Download Audio File to PC"
        >
          <ArrowDownToLine className="w-4 h-4" />
        </a>

        {/* Volume Controls */}
        <div className="flex items-center gap-2 pl-1 border-l border-zinc-800">
          <button
            onClick={toggleMute}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-zinc-500" />
            ) : volume < 0.5 ? (
              <Volume1 className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-20 h-1 bg-zinc-800 rounded-lg cursor-pointer accent-emerald-500"
          />
        </div>

        {/* Expand / Fullscreen */}
        <button
          onClick={() => setIsFullscreenOpen(true)}
          className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-[#161620] rounded-lg transition-colors"
          title="Full Screen / Lyrics View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
