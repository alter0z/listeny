'use client';

import React, { useEffect, useState } from 'react';
import { X, Plus, Disc3, Check, Loader2 } from 'lucide-react';
import type { Track, Playlist } from '@/types/music';
import { getSavedPlaylists, addTrackToPlaylist, createPlaylist } from '@/lib/storage';
import { PlaylistCover } from '@/components/PlaylistCover';

interface AddToPlaylistModalProps {
  track: Track | null;
  onClose: () => void;
}

export function AddToPlaylistModal({ track, onClose }: AddToPlaylistModalProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const pls = await getSavedPlaylists();
        setPlaylists(pls);
        if (track) {
          const alreadyAdded = new Set<string>();
          for (const p of pls) {
            if (p.tracks.some((t) => t.id === track.id)) {
              alreadyAdded.add(p.id);
            }
          }
          setAddedIds(alreadyAdded);
        }
      } catch (e) {
        console.error('Failed to load playlists for modal:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [track]);

  if (!track) return null;

  const handleAdd = async (playlistId: string) => {
    try {
      await addTrackToPlaylist(playlistId, track);
      setAddedIds((prev) => new Set(prev).add(playlistId));
    } catch (e) {
      console.error('Failed to add track to playlist:', e);
    }
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsCreating(true);
    try {
      const updated = await createPlaylist(newTitle.trim());
      setPlaylists(updated);
      const created = updated[0];
      if (created) {
        await addTrackToPlaylist(created.id, track);
        setAddedIds((prev) => new Set(prev).add(created.id));
      }
      setNewTitle('');
    } catch (e) {
      console.error('Failed to create playlist:', e);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="bg-[#121218] border border-[#222230] w-full max-w-md rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div>
            <h3 className="text-base font-bold text-white">Add to Playlist</h3>
            <p className="text-xs text-zinc-400 truncate max-w-[280px] mt-0.5">
              {track.title} • {track.artist}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create New Playlist Form */}
        <form onSubmit={handleCreateNew} className="py-4 border-b border-white/5 flex gap-2">
          <input
            type="text"
            placeholder="New playlist title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 px-3.5 py-2.5 bg-[#181822] border border-[#282836] rounded-xl text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={isCreating || !newTitle.trim()}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 shadow-md shadow-emerald-500/20"
          >
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>Create</span>
          </button>
        </form>

        {/* Playlists List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-zinc-500 gap-2 text-xs">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
              <span>Loading playlists...</span>
            </div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 text-xs">
              No playlists found. Create one above!
            </div>
          ) : (
            playlists.map((pl) => {
              const isAdded = addedIds.has(pl.id);
              return (
                <div
                  key={pl.id}
                  onClick={() => !isAdded && handleAdd(pl.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isAdded
                      ? 'bg-emerald-500/10 border-emerald-500/20 cursor-default'
                      : 'bg-[#181822] hover:bg-[#20202c] border-[#222230] hover:border-emerald-500/30 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#22222e] shrink-0">
                      <PlaylistCover playlist={pl} className="w-full h-full" iconClassName="w-5 h-5 text-zinc-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-semibold text-white truncate">{pl.title}</h4>
                      <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                        {pl.tracks?.length || 0} songs • {pl.source || 'custom'}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 pl-3">
                    {isAdded ? (
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                        <Check className="w-3.5 h-3.5" />
                        <span>Added</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-emerald-500 hover:text-black text-white text-xs font-semibold transition-colors"
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
