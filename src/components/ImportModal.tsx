'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  Save,
  Upload,
  FileText,
} from 'lucide-react';
import type { Playlist } from '@/types/music';
import { savePlaylist } from '@/lib/storage';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { parseImportFile } from '@/lib/fileImport';

type ImportTab = 'spotify' | 'youtube' | 'file';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaylistSaved: (playlist: Playlist) => void;
}

export function ImportModal({ isOpen, onClose, onPlaylistSaved }: ImportModalProps) {
  const [url, setUrl] = useState('');
  const [activeTab, setActiveTab] = useState<ImportTab>('spotify');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [importedPlaylist, setImportedPlaylist] = useState<Playlist | null>(null);

  // File import state
  const [fileName, setFileName] = useState('');
  const [enriching, setEnriching] = useState(false);
  const [enrichTotal, setEnrichTotal] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Session token so stale async file parsing / enrichment results
  // are discarded when the user switches tabs or picks a new file
  const fileSessionRef = useRef(0);

  const { playTrack } = useAudioPlayer();

  if (!isOpen) return null;

  const switchTab = (tab: ImportTab) => {
    if (tab === activeTab) return;
    fileSessionRef.current++;
    setActiveTab(tab);
    setImportedPlaylist(null);
    setError(null);
    setStatusMessage('');
    setFileName('');
    setEnriching(false);
    setUrl('');
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setStatusMessage('Analyzing playlist link...');
    setImportedPlaylist(null);

    try {
      let endpoint = '/api/import/spotify';
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        endpoint = '/api/import/youtube';
        setStatusMessage('Fetching YouTube Music playlist tracks...');
      } else {
        setStatusMessage('Extracting Spotify metadata and matching with YouTube Music streams (Hybrid Engine)...');
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to import playlist. Please check the URL.');
      }

      const data = await res.json();
      // Routes return { success, playlist, ... } — unwrap defensively
      const playlistData: Playlist = data.playlist || data;

      setImportedPlaylist(playlistData);
      setStatusMessage(`Successfully imported "${playlistData.title}" with ${playlistData.tracks.length} tracks!`);
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err.message || 'An error occurred during playlist import.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilePicked = async (file: File) => {
    const session = ++fileSessionRef.current;
    setError(null);
    setStatusMessage('');
    setImportedPlaylist(null);
    setEnriching(false);
    setFileName(file.name);
    setLoading(true);
    setStatusMessage(`Parsing ${file.name}...`);

    try {
      const text = await file.text();
      const parsed = parseImportFile(file.name, text);

      if (parsed.tracks.length === 0) {
        throw new Error(
          'No playable YouTube tracks found in this file. Expected a CSV (Title, Artist, Album, YouTube Video ID) or an M3U playlist.'
        );
      }

      const playlist: Playlist = {
        id: `file-${Date.now()}`,
        title: parsed.title,
        description: `Imported from ${file.name} (${parsed.format.toUpperCase()})`,
        author: 'Local File',
        thumbnail: parsed.tracks[0].thumbnail,
        trackCount: parsed.tracks.length,
        tracks: parsed.tracks,
        source: 'custom',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      if (session !== fileSessionRef.current) return;
      setImportedPlaylist(playlist);
      setLoading(false);
      setStatusMessage(
        parsed.skipped > 0
          ? `Imported ${parsed.tracks.length} tracks (${parsed.skipped} rows skipped — missing YouTube IDs).`
          : `Parsed ${parsed.tracks.length} tracks from ${file.name}.`
      );

      // CSV exports carry no duration — enrich from YouTube in the background
      const missingIds = playlist.tracks.filter((t) => !t.duration).map((t) => t.id);
      if (missingIds.length > 0 && session === fileSessionRef.current) {
        setEnriching(true);
        setEnrichTotal(missingIds.length);
        try {
          const res = await fetch('/api/import/file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoIds: missingIds }),
          });
          if (res.ok && session === fileSessionRef.current) {
            const data = await res.json();
            const durations: Record<string, number> = data.durations || {};
            const enrichedCount = Object.keys(durations).length;
            setImportedPlaylist((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                tracks: prev.tracks.map((t) => {
                  const d = durations[t.id];
                  if (!d) return t;
                  return {
                    ...t,
                    duration: d,
                    durationFormatted: `${Math.floor(d / 60)}:${(d % 60).toString().padStart(2, '0')}`,
                  };
                }),
              };
            });
            setStatusMessage(
              `Ready — ${playlist.tracks.length} tracks imported` +
                (enrichedCount > 0 ? ` · durations loaded for ${enrichedCount}` : '')
            );
          }
        } catch (err) {
          console.warn('Duration enrichment failed (playback will still work):', err);
        } finally {
          if (session === fileSessionRef.current) setEnriching(false);
        }
      }
    } catch (err: any) {
      if (session !== fileSessionRef.current) return;
      console.error('File import error:', err);
      setFileName('');
      setLoading(false);
      setEnriching(false);
      setError(err.message || 'Failed to parse the selected file.');
    }
  };

  const handleSaveAndPlay = async (autoPlay: boolean = false) => {
    if (!importedPlaylist) return;

    try {
      await savePlaylist(importedPlaylist);
      onPlaylistSaved(importedPlaylist);

      if (autoPlay && importedPlaylist.tracks.length > 0) {
        playTrack(importedPlaylist.tracks[0], importedPlaylist.tracks);
      }

      onClose();
      // Reset form
      setUrl('');
      setImportedPlaylist(null);
      setStatusMessage('');
      setFileName('');
      fileSessionRef.current++;
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save playlist to local storage.');
    }
  };

  const sourceLabel = (source?: string) =>
    source === 'custom' ? 'File' : source || 'Playlist';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-[#111116] border border-[#22222c] rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-[#20202a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Import Playlist</h2>
              <p className="text-xs text-zinc-400">
                Bridge Spotify, YouTube, or a local CSV / M3U file into Meld
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Switcher */}
        <div className="grid grid-cols-3 gap-2 mt-5 p-1 bg-[#181822] rounded-2xl border border-white/5">
          <button
            type="button"
            onClick={() => switchTab('spotify')}
            className={`py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'spotify'
                ? 'bg-[#1ed760] text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span className="font-bold">Spotify</span>
            <span className="text-[10px] opacity-75">(Fuzzy)</span>
          </button>
          <button
            type="button"
            onClick={() => switchTab('youtube')}
            className={`py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'youtube'
                ? 'bg-[#ff0000] text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span className="font-bold">YouTube</span>
            <span className="text-[10px] opacity-75">(Direct)</span>
          </button>
          <button
            type="button"
            onClick={() => switchTab('file')}
            className={`py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'file'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span className="font-bold">CSV / M3U</span>
            <span className="text-[10px] opacity-75">(Files)</span>
          </button>
        </div>

        {/* URL Form (Spotify / YouTube tabs) */}
        {activeTab !== 'file' && (
          <form onSubmit={handleImport} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">
                {activeTab === 'spotify'
                  ? 'Paste Spotify Playlist, Album, or Track URL:'
                  : 'Paste YouTube / YouTube Music Playlist URL:'}
              </label>
              <div className="relative flex items-center">
                <LinkIcon className="absolute left-4 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder={
                    activeTab === 'spotify'
                      ? 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M'
                      : 'https://music.youtube.com/playlist?list=RDCLAK5uy_k...'
                  }
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={loading}
                  className="w-full pl-11 pr-32 py-3 bg-[#181822] border border-[#272736] rounded-2xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={loading || !url.trim()}
                  className="absolute right-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing</span>
                    </div>
                  ) : (
                    'Import'
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* File Dropzone (CSV / M3U tab) */}
        {activeTab === 'file' && (
          <div className="mt-5">
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
              }}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleFilePicked(file);
              }}
              className="group border-2 border-dashed border-[#2a2a36] hover:border-emerald-500/50 hover:bg-emerald-500/5 rounded-2xl p-8 cursor-pointer transition-all flex flex-col items-center gap-3 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#181822] border border-[#272736] flex items-center justify-center group-hover:border-emerald-500/40 transition-colors">
                <Upload className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-200">
                  {fileName ? 'File selected — click to replace' : 'Drop a CSV or M3U file here'}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Compatible with Meld mobile exports —{' '}
                  <span className="text-zinc-400">Title, Artist, Album, YouTube Video ID</span>
                  <br />
                  or any .m3u / .m3u8 playlist
                </p>
              </div>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors group-hover:bg-emerald-500/20">
                Browse Files
              </span>
              {fileName && (
                <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  {fileName}
                </span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.m3u,.m3u8,text/csv,audio/x-mpegurl,audio/mpegurl"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFilePicked(file);
                e.target.value = ''; // allow re-selecting the same file
              }}
            />
          </div>
        )}

        {/* Duration enrichment progress */}
        {enriching && (
          <div className="mt-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-3 text-emerald-400 text-xs mb-2.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span>Fetching durations for {enrichTotal} tracks…</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#1c1c26] overflow-hidden">
              <div className="h-full w-1/2 bg-emerald-500 rounded-full animate-pulse" />
            </div>
          </div>
        )}

        {/* Feedback / Status */}
        {loading && (
          <div className="mt-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-400 text-xs">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Imported Playlist Preview */}
        {importedPlaylist && (
          <div className="mt-5 flex-1 overflow-y-auto pr-1 space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#181822] border border-[#272736]">
              {importedPlaylist.thumbnail ? (
                <img
                  src={importedPlaylist.thumbnail}
                  alt={importedPlaylist.title}
                  className="w-16 h-16 rounded-xl object-cover shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-[#101014] border border-[#272736] flex items-center justify-center">
                  <FileText className="w-6 h-6 text-zinc-600" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {sourceLabel(importedPlaylist.source)}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {activeTab === 'file'
                      ? `${importedPlaylist.tracks.length} tracks`
                      : `${importedPlaylist.tracks.length} tracks matched`}
                  </span>
                </div>
                <h4 className="text-base font-bold text-white truncate mt-1">
                  {importedPlaylist.title}
                </h4>
                <p className="text-xs text-zinc-400 truncate">
                  By {importedPlaylist.author || 'Unknown'}
                </p>
              </div>
            </div>

            {/* Track List Preview */}
            <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
              {importedPlaylist.tracks.map((track, idx) => (
                <div
                  key={track.id || idx}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[#14141c] hover:bg-[#1a1a24] text-xs transition-colors"
                >
                  <span className="w-5 text-center text-zinc-500 font-mono text-[11px]">
                    {idx + 1}
                  </span>
                  <img
                    src={track.thumbnail}
                    alt={track.title}
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-zinc-200 truncate">{track.title}</p>
                    <p className="text-zinc-500 truncate text-[11px]">{track.artist}</p>
                  </div>
                  <span className="text-zinc-500 font-mono text-[11px]">
                    {track.durationFormatted ||
                      `${Math.floor(track.duration / 60)}:${(track.duration % 60)
                        .toString()
                        .padStart(2, '0')}`}
                  </span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#20202a]">
              <button
                type="button"
                onClick={() => handleSaveAndPlay(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save to Library</span>
              </button>
              <button
                type="button"
                onClick={() => handleSaveAndPlay(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shadow-lg shadow-emerald-500/25 transition-all"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Save & Play Now</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}