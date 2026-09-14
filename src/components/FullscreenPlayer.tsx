'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  DownloadCloud,
  ArrowDownToLine,
  Volume2,
  VolumeX,
  Volume1,
  Mic2,
  Activity,
  Music2,
} from 'lucide-react';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { AudioVisualizer } from '@/components/AudioVisualizer';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function FullscreenPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffle,
    isFavorite,
    isDownloaded,
    lyrics,
    activeLyricIndex,
    isFullscreenOpen,
    setIsFullscreenOpen,
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
  } = useAudioPlayer();

  const [activeTab, setActiveTab] = useState<'lyrics' | 'visualizer'>('lyrics');
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll active synced lyric into view
  useEffect(() => {
    if (activeLyricIndex >= 0 && lyricsContainerRef.current) {
      const activeEl = lyricsContainerRef.current.querySelector(
        `[data-lyric-idx="${activeLyricIndex}"]`
      ) as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [activeLyricIndex]);

  if (!isFullscreenOpen || !currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-[#070709] flex flex-col text-white animate-in fade-in zoom-in-95 duration-200 select-none overflow-hidden">
      {/* Dynamic Background Blur Backdrop */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-20 scale-125 pointer-events-none transition-all duration-1000"
        style={{ backgroundImage: `url(${currentTrack.thumbnail})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-[#070709]/80 to-transparent pointer-events-none" />

      {/* Top Header Bar */}
      <div className="relative z-10 px-8 py-6 flex items-center justify-between">
        <button
          onClick={() => setIsFullscreenOpen(false)}
          className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
          title="Minimize"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'lyrics'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Mic2 className="w-4 h-4" />
            <span>Lyrics</span>
          </button>
          <button
            onClick={() => setActiveTab('visualizer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'visualizer'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Visualizer</span>
          </button>
        </div>

        <div className="w-12" /> {/* Spacer */}
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-2 gap-12 px-8 lg:px-20 py-4 max-w-7xl mx-auto w-full items-center overflow-hidden">
        {/* Left Side: Artwork, Title & Info */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left max-w-md mx-auto lg:mx-0">
          <div className="relative group w-64 sm:w-80 lg:w-96 aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-black/80 border border-white/10">
            <img
              src={currentTrack.thumbnail}
              alt={currentTrack.title}
              className={`w-full h-full object-cover transition-transform duration-700 ${
                isPlaying ? 'scale-105' : 'scale-100'
              }`}
            />
            {/* Visualizer overlay */}
            <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/80 to-transparent p-2 flex items-end">
              <AudioVisualizer type="bars" className="h-10 opacity-80" />
            </div>
          </div>

          <div className="mt-8 w-full">
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight truncate">
              {currentTrack.title}
            </h1>
            <p className="text-lg text-zinc-400 mt-1.5 font-medium truncate">
              {currentTrack.artist}
            </p>
            {currentTrack.album && (
              <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider font-semibold truncate">
                {currentTrack.album}
              </p>
            )}
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={toggleFavorite}
              className={`p-3 rounded-2xl border transition-all ${
                isFavorite
                  ? 'bg-rose-500/20 border-rose-500/30 text-rose-400'
                  : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
              title={isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-500' : ''}`} />
            </button>

            <button
              onClick={toggleDownloadOffline}
              className={`p-3 rounded-2xl border transition-all ${
                isDownloaded
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                  : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
              title={isDownloaded ? 'Downloaded Offline' : 'Save Offline'}
            >
              <DownloadCloud className="w-5 h-5" />
            </button>

            <a
              href={`/api/download/${currentTrack.id}?title=${encodeURIComponent(
                currentTrack.title
              )}&artist=${encodeURIComponent(currentTrack.artist)}`}
              download={`${currentTrack.artist} - ${currentTrack.title}.mp3`}
              className="p-3 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Download File to Computer"
            >
              <ArrowDownToLine className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Right Side: Lyrics or Full Visualizer */}
        <div className="h-full flex flex-col justify-center min-h-[360px] overflow-hidden">
          {activeTab === 'lyrics' ? (
            <div
              ref={lyricsContainerRef}
              className="h-[480px] overflow-y-auto px-6 py-12 space-y-6 scroll-smooth scrollbar-none mask-gradient"
            >
              {lyrics?.synced && lyrics.synced.length > 0 ? (
                lyrics.synced.map((line, idx) => {
                  const isActive = idx === activeLyricIndex;
                  return (
                    <p
                      key={idx}
                      data-lyric-idx={idx}
                      onClick={() => seek(line.time)}
                      className={`cursor-pointer transition-all duration-300 font-bold leading-relaxed ${
                        isActive
                          ? 'text-2xl lg:text-3xl text-emerald-400 scale-105 origin-left'
                          : 'text-lg lg:text-xl text-zinc-600 hover:text-zinc-300'
                      }`}
                    >
                      {line.text || '♪ ♪ ♪'}
                    </p>
                  );
                })
              ) : lyrics?.plain ? (
                <div className="whitespace-pre-line text-lg text-zinc-400 leading-relaxed font-medium">
                  {lyrics.plain}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-3">
                  <Music2 className="w-10 h-10 stroke-[1.5] text-zinc-600" />
                  <p className="text-sm font-medium">Lyrics not available for this track</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center bg-black/40 rounded-3xl p-8 border border-white/10">
              <AudioVisualizer type="wave" className="w-full h-48" />
              <div className="mt-8 w-full">
                <AudioVisualizer type="bars" className="w-full h-24" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="relative z-10 px-8 lg:px-20 pb-10 pt-4 max-w-5xl mx-auto w-full">
        {/* Progress Bar */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-xs font-mono text-zinc-400 w-12 text-right">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 flex items-center group h-4">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg cursor-pointer accent-emerald-500 hover:h-2 transition-all"
            />
            <div
              className="absolute left-0 top-1.5 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-lg pointer-events-none"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-mono text-zinc-400 w-12">
            {formatTime(duration)}
          </span>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleShuffle}
              className={`p-3 rounded-xl transition-colors ${
                isShuffle ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Shuffle className="w-5 h-5" />
            </button>
            <button
              onClick={cycleRepeatMode}
              className={`p-3 rounded-xl transition-colors ${
                repeatMode !== 'off'
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={prev}
              className="p-3 text-zinc-300 hover:text-white hover:scale-110 active:scale-95 transition-all"
            >
              <SkipBack className="w-7 h-7 fill-current" />
            </button>
            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black flex items-center justify-center shadow-xl shadow-emerald-500/30 transition-all"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 fill-black text-black stroke-[2.5]" />
              ) : (
                <Play className="w-7 h-7 fill-black text-black ml-1 stroke-[2.5]" />
              )}
            </button>
            <button
              onClick={next}
              className="p-3 text-zinc-300 hover:text-white hover:scale-110 active:scale-95 transition-all"
            >
              <SkipForward className="w-7 h-7 fill-current" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggleMute} className="text-zinc-400 hover:text-white">
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-24 h-1.5 bg-zinc-800 rounded-lg cursor-pointer accent-emerald-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
