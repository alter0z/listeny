'use client';

import React, { useEffect, useState } from 'react';
import {
  Play,
  Sparkles,
  TrendingUp,
  Disc3,
  Music2,
  Compass,
  Flame,
  Radio,
  Plus,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import type { Track, Playlist, HomeSection } from '@/types/music';
import { useAudioPlayer } from '@/context/AudioPlayerContext';

interface ExploreViewProps {
  onSelectPlaylist: (playlist: Playlist) => void;
  onSearchGenre: (genre: string) => void;
  onOpenImport: () => void;
}

const GENRES = [
  { name: 'Pop', color: 'from-pink-500 to-rose-500' },
  { name: 'Hip-Hop & Rap', color: 'from-amber-500 to-orange-600' },
  { name: 'Electronic / EDM', color: 'from-cyan-500 to-blue-600' },
  { name: 'Rock & Metal', color: 'from-red-600 to-zinc-800' },
  { name: 'R&B / Soul', color: 'from-purple-500 to-indigo-600' },
  { name: 'Lo-Fi & Chill', color: 'from-emerald-500 to-teal-700' },
  { name: 'Gaming / Synthwave', color: 'from-fuchsia-500 to-pink-600' },
  { name: 'Indie & Acoustic', color: 'from-yellow-500 to-emerald-600' },
];

export function ExploreView({
  onSelectPlaylist,
  onSearchGenre,
  onOpenImport,
}: ExploreViewProps) {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroTrack, setHeroTrack] = useState<Track | null>(null);

  const { playTrack, currentTrack, isPlaying, addToQueue } = useAudioPlayer();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch('/api/explore');
        if (res.ok) {
          const json = await res.json();
          if (isMounted) {
            const feedSections: HomeSection[] = Array.isArray(json) ? json : (json.sections || []);
            setSections(feedSections);

            if (json.quickPicks && json.quickPicks.length > 0) {
              setHeroTrack(json.quickPicks[0]);
            } else {
              for (const sec of feedSections) {
                if (sec.tracks && sec.tracks.length > 0) {
                  setHeroTrack(sec.tracks[0]);
                  break;
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Explore fetch failed:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex-1 overflow-y-auto pb-28 px-6 lg:px-10 py-8 select-none">
      {/* Hero Showcase Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-950 via-[#101915] to-[#0c0c10] border border-emerald-500/20 p-8 lg:p-12 mb-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Listeny Hybrid Engine</span>
          </div>

          <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Stream, Import & Download Music Anywhere
          </h1>
          <p className="text-sm lg:text-base text-zinc-300 mt-3 font-normal max-w-xl">
            Enjoy full high-quality audio streaming, real-time synchronized karaoke lyrics,
            lossless offline downloads, and 1-click Spotify & YouTube playlist imports.
          </p>

          <div className="flex items-center gap-4 mt-8 flex-wrap">
            {heroTrack && (
              <button
                onClick={() => playTrack(heroTrack)}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-bold text-sm shadow-xl shadow-emerald-500/25 transition-all"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Play Spotlight</span>
              </button>
            )}

            <button
              onClick={onOpenImport}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/10 transition-all backdrop-blur-md"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Import Spotify Playlist</span>
            </button>
          </div>
        </div>
      </div>

      {/* Genre Exploration Chips */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-400" />
            <span>Explore Genres & Moods</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {GENRES.map((g) => (
            <button
              key={g.name}
              onClick={() => onSearchGenre(g.name)}
              className={`h-20 rounded-2xl bg-gradient-to-br ${g.color} p-3 text-left relative overflow-hidden group hover:scale-[1.03] active:scale-[0.98] transition-all shadow-lg shadow-black/40`}
            >
              <span className="text-xs font-bold text-white leading-snug block drop-shadow-md">
                {g.name}
              </span>
              <Music2 className="absolute -bottom-2 -right-2 w-12 h-12 text-white/20 group-hover:scale-110 transition-transform" />
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-500">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-xs font-medium">Curating your explore feed...</p>
        </div>
      )}

      {/* Sections from YouTube Music / Innertube */}
      {!loading && sections.map((section, idx) => (
        <div key={idx} className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Flame className="w-5 h-5 text-emerald-400" />
              <span>{section.title}</span>
            </h2>
          </div>

          {/* If section contains tracks */}
          {section.tracks && section.tracks.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {section.tracks.slice(0, 10).map((track) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    className="group bg-[#121217] hover:bg-[#181822] border border-[#1e1e28] hover:border-emerald-500/30 rounded-2xl p-3.5 transition-all duration-200 cursor-pointer shadow-md"
                  >
                    <div
                      onClick={() => playTrack(track, section.tracks)}
                      className="relative aspect-square rounded-xl overflow-hidden bg-[#181820] mb-3"
                    >
                      <img
                        src={track.thumbnail}
                        alt={track.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div
                        className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                          isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg shadow-emerald-500/40 hover:scale-110 active:scale-95 transition-all">
                          <Play className="w-5 h-5 fill-black ml-0.5" />
                        </div>
                      </div>
                    </div>

                    <div onClick={() => playTrack(track, section.tracks)}>
                      <h4 className="text-sm font-semibold text-zinc-100 truncate group-hover:text-emerald-400 transition-colors">
                        {track.title}
                      </h4>
                      <p className="text-xs text-zinc-400 truncate mt-1">
                        {track.artist}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#1c1c24] text-[11px] text-zinc-500">
                      <span>{track.durationFormatted || '3:30'}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToQueue(track);
                        }}
                        className="hover:text-zinc-200 transition-colors flex items-center gap-1"
                        title="Add to queue"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Queue</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* If section contains playlists / albums */}
          {section.playlists && section.playlists.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {section.playlists.slice(0, 6).map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => onSelectPlaylist(pl)}
                  className="group bg-[#121217] hover:bg-[#181822] border border-[#1e1e28] hover:border-emerald-500/30 rounded-2xl p-3 transition-all duration-200 cursor-pointer shadow-md"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-[#181820] mb-2.5">
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
                  </div>
                  <h4 className="text-xs font-semibold text-zinc-100 truncate group-hover:text-emerald-400 transition-colors">
                    {pl.title}
                  </h4>
                  <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                    {pl.author || 'Playlist'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
