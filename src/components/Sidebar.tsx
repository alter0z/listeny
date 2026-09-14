'use client';

import React from 'react';
import {
  Compass,
  Search,
  Library,
  DownloadCloud,
  Heart,
  PlusCircle,
  Music2,
  Radio,
  Disc3,
  Sparkles,
} from 'lucide-react';
import type { Playlist } from '@/types/music';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  playlists: Playlist[];
  onSelectPlaylist: (playlist: Playlist) => void;
  onOpenImport: () => void;
  offlineCount: number;
}

export function Sidebar({
  currentView,
  setCurrentView,
  playlists,
  onSelectPlaylist,
  onOpenImport,
  offlineCount,
}: SidebarProps) {
  return (
    <aside className="w-64 bg-[#0a0a0d] border-r border-[#1e1e24] flex flex-col h-full shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-[#18181f]">
        <div
          onClick={() => setCurrentView('explore')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Music2 className="w-5 h-5 text-black stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                Meld
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Web
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-medium">Hybrid Music Engine</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="p-3 space-y-1">
        <button
          onClick={() => setCurrentView('explore')}
          className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            currentView === 'explore'
              ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#14141a]'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span>Explore</span>
        </button>

        <button
          onClick={() => setCurrentView('search')}
          className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            currentView === 'search'
              ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#14141a]'
          }`}
        >
          <Search className="w-5 h-5" />
          <span>Search</span>
        </button>

        <button
          onClick={() => setCurrentView('library')}
          className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            currentView === 'library'
              ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#14141a]'
          }`}
        >
          <Library className="w-5 h-5" />
          <span>Library</span>
        </button>

        <button
          onClick={() => setCurrentView('downloads')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            currentView === 'downloads'
              ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#14141a]'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <DownloadCloud className="w-5 h-5" />
            <span>Downloads</span>
          </div>
          {offlineCount > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {offlineCount}
            </span>
          )}
        </button>
      </div>

      {/* Import & Actions Bar */}
      <div className="px-3 pt-2 pb-3">
        <button
          onClick={onOpenImport}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 text-black shadow-md shadow-emerald-500/15 hover:opacity-95 active:scale-[0.98] transition-all"
        >
          <Sparkles className="w-4 h-4 stroke-[2.5]" />
          <span>Import Playlist</span>
        </button>
      </div>

      {/* Playlists Divider */}
      <div className="px-5 py-2 flex items-center justify-between text-xs font-semibold text-zinc-500 uppercase tracking-wider">
        <span>Playlists</span>
        <button
          onClick={onOpenImport}
          className="hover:text-zinc-300 transition-colors"
          title="Import or Create Playlist"
        >
          <PlusCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Playlist List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-20">
        {playlists.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-zinc-600">
            No playlists yet. Import from Spotify or YouTube!
          </div>
        ) : (
          playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => onSelectPlaylist(pl)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm text-zinc-400 hover:text-zinc-100 hover:bg-[#15151c] group transition-colors"
            >
              <div className="w-8 h-8 rounded-md bg-[#1e1e26] flex items-center justify-center shrink-0 overflow-hidden">
                {pl.thumbnail ? (
                  <img src={pl.thumbnail} alt={pl.title} className="w-full h-full object-cover" />
                ) : (
                  <Disc3 className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-zinc-300 group-hover:text-white">
                  {pl.title}
                </p>
                <p className="text-[10px] text-zinc-500 truncate">
                  {pl.source === 'spotify' ? 'Spotify' : pl.source === 'youtube' ? 'YouTube' : 'Custom'} • {pl.tracks?.length || 0} tracks
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
