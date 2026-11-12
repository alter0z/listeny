'use client';
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Play,
  Shuffle,
  Disc3,
  Music,
  Plus,
  Heart,
  DownloadCloud,
  ArrowDownToLine,
  Loader2,
  Users,
} from 'lucide-react';
import type { Artist, Track, Album } from '@/types/music';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { saveTrackOffline, toggleFavoriteTrack, isTrackFavorite, isTrackCachedOffline } from '@/lib/storage';

interface ArtistDetailViewProps {
  artistId: string;
  initialArtist?: Artist;
  onBack: () => void;
  onSelectAlbum?: (album: Album) => void;
}

export function ArtistDetailView({
  artistId,
  initialArtist,
  onBack,
  onSelectAlbum,
}: ArtistDetailViewProps) {
  const [artist, setArtist] = useState<Artist | null>(initialArtist || null);
  const [loading, setLoading] = useState(!initialArtist);
  const [error, setError] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());

  const { playTrack, addToQueue, currentTrack } = useAudioPlayer();

  useEffect(() => {
    let isMounted = true;
    async function fetchArtist() {
      if (!artistId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/artist/${artistId}`);
        if (!res.ok) throw new Error('Failed to fetch artist details');
        const data = await res.json();
        if (isMounted) {
          setArtist(data);
          const favs = new Set<string>();
          const downs = new Set<string>();
          for (const track of (data.topSongs || [])) {
            if (await isTrackFavorite(track.id)) favs.add(track.id);
            if (await isTrackCachedOffline(track.id)) downs.add(track.id);
          }
          setFavoriteIds(favs);
          setDownloadedIds(downs);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Error loading artist');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (!initialArtist || !initialArtist.topSongs || initialArtist.topSongs.length === 0) {
      fetchArtist();
    } else {
      (async () => {
        const favs = new Set<string>();
        const downs = new Set<string>();
        for (const track of (initialArtist.topSongs || [])) {
          if (await isTrackFavorite(track.id)) favs.add(track.id);
          if (await isTrackCachedOffline(track.id)) downs.add(track.id);
        }
        setFavoriteIds(favs);
        setDownloadedIds(downs);
      })();
    }
    return () => {
      isMounted = false;
    };
  }, [artistId, initialArtist]);

  const handleToggleFav = async (track: Track) => {
    await toggleFavoriteTrack(track);
    const updated = new Set(favoriteIds);
    if (updated.has(track.id)) {
      updated.delete(track.id);
    } else {
      updated.add(track.id);
    }
    setFavoriteIds(updated);
  };

  const handlePlayAll = (shuffle: boolean = false) => {
    if (!artist || !artist.topSongs || artist.topSongs.length === 0) return;
    let tracks = [...artist.topSongs];
    if (shuffle) {
      tracks = tracks.sort(() => Math.random() - 0.5);
    }
    playTrack(tracks[0], tracks);
  };

  const handleDownloadTrack = async (track: Track) => {
    try {
      const res = await fetch(`/api/stream/${track.id}`);
      if (res.ok) {
        const blob = await res.blob();
        await saveTrackOffline(track, blob);
      }
    } catch (err) {
      console.warn('Failed to cache track:', err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-28 select-none">
      {/* Top Banner Header */}
      <div className="relative p-6 lg:p-10 bg-gradient-to-b from-emerald-950/40 via-[#101017] to-[#070709] border-b border-[#1c1c26]">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-semibold mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 lg:gap-8">
          <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-[#181824] shadow-2xl shadow-black/80 overflow-hidden shrink-0 border-4 border-emerald-500/20">
            {artist?.thumbnail ? (
              <img
                src={artist.thumbnail}
                alt={artist.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Disc3 className="w-16 h-16 text-zinc-600" />
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>Artist</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {artist?.name || 'Loading Artist...'}
            </h1>

            {artist?.subscribers && (
              <p className="text-sm text-zinc-400 font-medium mt-2">
                {artist.subscribers}
              </p>
            )}

            {artist?.description && (
              <p className="text-xs text-zinc-400 mt-2 line-clamp-2 max-w-2xl">
                {artist.description}
              </p>
            )}

            {/* Action Buttons */}
            {artist?.topSongs && artist.topSongs.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 mt-6 justify-center sm:justify-start">
                <button
                  type="button"
                  onClick={() => handlePlayAll(false)}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>Play Top Songs</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePlayAll(true)}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#1e1e28] hover:bg-[#252532] text-white font-semibold text-sm transition-all border border-white/5 hover:border-white/10"
                >
                  <Shuffle className="w-4 h-4 text-emerald-400" />
                  <span>Shuffle</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading or Error */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-500">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-xs font-medium">Loading artist top songs and albums...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-20 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {!loading && artist && (
        <div className="p-6 lg:p-10 space-y-10">
          {/* Top Songs Section */}
          {artist.topSongs && artist.topSongs.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Music className="w-5 h-5 text-emerald-400" />
                <span>Top Songs</span>
              </h3>

              <div className="space-y-1">
                {artist.topSongs.map((track, idx) => {
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
                      <div
                        onClick={() => playTrack(track, artist.topSongs!)}
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
                            {track.album ? track.album : artist.name}
                          </p>
                        </div>
                      </div>

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
                          onClick={() => handleDownloadTrack(track)}
                          className={`p-2 rounded-xl transition-colors ${
                            isDown
                              ? 'text-emerald-400'
                              : 'text-zinc-500 hover:text-white hover:bg-white/5'
                          }`}
                          title={isDown ? 'Saved offline' : 'Save offline'}
                        >
                          <DownloadCloud className="w-4 h-4" />
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
            </div>
          )}

          {/* Albums & Singles Section */}
          {((artist.albums && artist.albums.length > 0) ||
            (artist.singles && artist.singles.length > 0)) && (
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Disc3 className="w-5 h-5 text-emerald-400" />
                <span>Albums & Singles</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {[...(artist.albums || []), ...(artist.singles || [])].map((album) => (
                  <div
                    key={album.id}
                    onClick={() => {
                      if (onSelectAlbum) onSelectAlbum(album);
                    }}
                    className="group bg-[#121217] hover:bg-[#181822] border border-[#1e1e28] hover:border-emerald-500/30 rounded-2xl p-3 transition-all duration-200 cursor-pointer shadow-md"
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-[#181820] mb-2.5">
                      {album.thumbnail ? (
                        <img
                          src={album.thumbnail}
                          alt={album.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Disc3 className="w-10 h-10 text-zinc-600" />
                        </div>
                      )}
                    </div>
                    <h4 className="text-xs font-semibold text-zinc-100 truncate group-hover:text-emerald-400 transition-colors">
                      {album.title}
                    </h4>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                      {album.year ? `${album.year} • Album` : 'Album'}
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
