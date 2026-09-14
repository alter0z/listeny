'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type { Track, LyricsData } from '@/types/music';
import {
  addToHistory,
  getOfflineAudioUrl,
  saveTrackOffline,
  removeTrackOffline,
  isTrackCachedOffline,
  getCachedLyrics,
  cacheLyrics,
  getFavoriteTracks,
  toggleFavoriteTrack,
} from '@/lib/storage';

export type RepeatMode = 'off' | 'all' | 'one';

interface AudioPlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  queue: Track[];
  queueIndex: number;
  lyrics: LyricsData | null;
  activeLyricIndex: number;
  isFavorite: boolean;
  isDownloaded: boolean;
  isFullscreenOpen: boolean;
  isQueueOpen: boolean;
  isLyricsOpen: boolean;
  isVisualizerActive: boolean;

  // Actions
  playTrack: (track: Track, newQueue?: Track[]) => Promise<void>;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  addToQueue: (tracks: Track | Track[]) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  toggleFavorite: () => Promise<void>;
  toggleDownloadOffline: () => Promise<void>;
  setIsFullscreenOpen: (open: boolean) => void;
  setIsQueueOpen: (open: boolean) => void;
  setIsLyricsOpen: (open: boolean) => void;
  setIsVisualizerActive: (active: boolean) => void;
  getFrequencyData: () => Uint8Array | null;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isShuffle, setIsShuffle] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);

  const [lyrics, setLyrics] = useState<LyricsData | null>(null);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isVisualizerActive, setIsVisualizerActive] = useState(false);

  // Audio and Web Audio API refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const frequencyDataRef = useRef<Uint8Array | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const repeatModeRef = useRef<RepeatMode>(repeatMode);
  repeatModeRef.current = repeatMode;

  const handleNextTrackRef = useRef<() => void>(() => {});

  // Initialize HTML5 Audio element once on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio();
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    audio.volume = 0.85;
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => setIsLoading(false);
    const onLoadedMetadata = () => {
      setIsLoading(false);
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onEnded = () => {
      if (repeatModeRef.current === 'one') {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      } else {
        handleNextTrackRef.current();
      }
    };

    const onError = (e: any) => {
      const mediaErr = audio.error;
      console.error('Audio playback error details:', {
        event: e,
        code: mediaErr?.code,
        message: mediaErr?.message,
        src: audio.src,
      });
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);

      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  // Connect Web Audio API Analyser safely
  const initAudioContext = useCallback(() => {
    if (typeof window === 'undefined' || !audioRef.current) return;

    if (audioContextRef.current) {
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;

      if (!sourceNodeRef.current) {
        const source = ctx.createMediaElementSource(audioRef.current);
        source.connect(analyser);
        analyser.connect(ctx.destination);
        sourceNodeRef.current = source;
      }

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      frequencyDataRef.current = new Uint8Array(analyser.frequencyBinCount);
    } catch (err) {
      console.warn('Web Audio API context could not be initialized:', err);
    }
  }, []);

  const getFrequencyData = useCallback((): Uint8Array | null => {
    if (!analyserRef.current || !frequencyDataRef.current) return null;
    analyserRef.current.getByteFrequencyData(frequencyDataRef.current as any);
    return frequencyDataRef.current;
  }, []);

  // Update synchronized lyrics index when currentTime changes
  useEffect(() => {
    if (!lyrics?.synced || lyrics.synced.length === 0) {
      setActiveLyricIndex(-1);
      return;
    }

    let foundIdx = -1;
    for (let i = 0; i < lyrics.synced.length; i++) {
      if (currentTime >= lyrics.synced[i].time) {
        foundIdx = i;
      } else {
        break;
      }
    }
    setActiveLyricIndex(foundIdx);
  }, [currentTime, lyrics]);

  // Update MediaSession metadata & handlers
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator) || !currentTrack) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: currentTrack.album || 'Listeny',
      artwork: [
        { src: currentTrack.thumbnail, sizes: '96x96', type: 'image/jpeg' },
        { src: currentTrack.thumbnail, sizes: '128x128', type: 'image/jpeg' },
        { src: currentTrack.thumbnail, sizes: '256x256', type: 'image/jpeg' },
        { src: currentTrack.thumbnail, sizes: '512x512', type: 'image/jpeg' },
      ],
    });

    navigator.mediaSession.setActionHandler('play', () => resume());
    navigator.mediaSession.setActionHandler('pause', () => pause());
    navigator.mediaSession.setActionHandler('previoustrack', () => prev());
    navigator.mediaSession.setActionHandler('nexttrack', () => next());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) seek(details.seekTime);
    });
  }, [currentTrack]);

  // Load favorites and download status when track changes
  useEffect(() => {
    if (!currentTrack) return;

    let isMounted = true;
    (async () => {
      const favs = await getFavoriteTracks();
      const isFav = favs.some((t) => t.id === currentTrack.id);
      const isDown = await isTrackCachedOffline(currentTrack.id);

      if (isMounted) {
        setIsFavorite(isFav);
        setIsDownloaded(isDown);
      }
    })();

    // Fetch and cache lyrics
    (async () => {
      const cached = await getCachedLyrics(currentTrack.id);
      if (cached && isMounted) {
        setLyrics(cached);
        return;
      }

      try {
        const queryParams = new URLSearchParams({
          title: currentTrack.title,
          artist: currentTrack.artist,
          duration: String(currentTrack.duration || 0),
        });
        const res = await fetch(`/api/lyrics/${currentTrack.id}?${queryParams.toString()}`);
        if (res.ok) {
          const data: LyricsData = await res.json();
          if (isMounted) {
            setLyrics(data);
            await cacheLyrics(currentTrack.id, data);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch lyrics:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [currentTrack]);

  // Core Play function
  const playTrack = useCallback(async (track: Track, newQueue?: Track[]) => {
    if (!audioRef.current) return;
    initAudioContext();

    setIsLoading(true);
    setCurrentTrack(track);
    setLyrics(null);
    setCurrentTime(0);

    // Update queue if provided
    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
      const idx = newQueue.findIndex((t) => t.id === track.id);
      setQueueIndex(idx >= 0 ? idx : 0);
    } else {
      setQueue((prevQueue) => {
        const exists = prevQueue.some((t) => t.id === track.id);
        if (!exists) {
          return [track, ...prevQueue];
        }
        return prevQueue;
      });
      setQueueIndex(0);
    }

    // Check offline cache first
    let audioSrc = `/api/stream/${track.id}`;
    const offlineUrl = await getOfflineAudioUrl(track.id);

    if (offlineUrl) {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
      blobUrlRef.current = offlineUrl;
      audioSrc = offlineUrl;
    }

    audioRef.current.src = audioSrc;

    try {
      await audioRef.current.play();
      setIsPlaying(true);
      await addToHistory(track);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Play error:', err);
      }
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, [initAudioContext]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack) return;
    initAudioContext();

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
  }, [isPlaying, currentTrack, initAudioContext]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current && currentTrack) {
      initAudioContext();
      audioRef.current.play().catch(console.error);
    }
  }, [currentTrack, initAudioContext]);

  const handleNextTrack = useCallback(() => {
    if (queue.length === 0) return;

    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      setQueueIndex(randomIndex);
      playTrack(queue[randomIndex]);
      return;
    }

    const nextIndex = queueIndex + 1;
    if (nextIndex < queue.length) {
      setQueueIndex(nextIndex);
      playTrack(queue[nextIndex]);
    } else if (repeatModeRef.current === 'all') {
      setQueueIndex(0);
      playTrack(queue[0]);
    } else {
      setIsPlaying(false);
    }
  }, [queue, queueIndex, isShuffle, playTrack]);

  handleNextTrackRef.current = handleNextTrack;

  const next = useCallback(() => {
    handleNextTrack();
  }, [handleNextTrack]);

  const prev = useCallback(() => {
    if (!audioRef.current) return;

    // If more than 3 seconds in, restart current track
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    if (queue.length === 0) return;

    const prevIndex = queueIndex - 1;
    if (prevIndex >= 0) {
      setQueueIndex(prevIndex);
      playTrack(queue[prevIndex]);
    } else {
      // Loop back to last item
      setQueueIndex(queue.length - 1);
      playTrack(queue[queue.length - 1]);
    }
  }, [queue, queueIndex, playTrack]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(time, duration || 0));
      setCurrentTime(audioRef.current.currentTime);
    }
  }, [duration]);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
      if (clamped > 0 && isMuted) {
        setIsMuted(false);
        audioRef.current.muted = false;
      }
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    const newMute = !isMuted;
    setIsMuted(newMute);
    audioRef.current.muted = newMute;
  }, [isMuted]);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const addToQueue = useCallback((tracks: Track | Track[]) => {
    const newItems = Array.isArray(tracks) ? tracks : [tracks];
    setQueue((prev) => [...prev, ...newItems]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
    setQueueIndex((prevIndex) => {
      if (index < prevIndex) return prevIndex - 1;
      if (index === prevIndex && prevIndex >= queue.length - 1) return Math.max(0, queue.length - 2);
      return prevIndex;
    });
  }, [queue.length]);

  const clearQueue = useCallback(() => {
    setQueue(currentTrack ? [currentTrack] : []);
    setQueueIndex(0);
  }, [currentTrack]);

  const reorderQueue = useCallback((startIndex: number, endIndex: number) => {
    setQueue((prev) => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  const toggleFavorite = useCallback(async () => {
    if (!currentTrack) return;
    const newFav = await toggleFavoriteTrack(currentTrack);
    setIsFavorite(newFav);
  }, [currentTrack]);

  const toggleDownloadOffline = useCallback(async () => {
    if (!currentTrack) return;

    if (isDownloaded) {
      await removeTrackOffline(currentTrack.id);
      setIsDownloaded(false);
    } else {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/stream/${currentTrack.id}`);
        if (!res.ok) throw new Error('Stream fetch failed');
        const blob = await res.blob();
        await saveTrackOffline(currentTrack, blob);
        setIsDownloaded(true);
      } catch (err) {
        console.error('Failed to cache track offline:', err);
      } finally {
        setIsLoading(false);
      }
    }
  }, [currentTrack, isDownloaded]);

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isLoading,
        currentTime,
        duration,
        volume,
        isMuted,
        repeatMode,
        isShuffle,
        queue,
        queueIndex,
        lyrics,
        activeLyricIndex,
        isFavorite,
        isDownloaded,
        isFullscreenOpen,
        isQueueOpen,
        isLyricsOpen,
        isVisualizerActive,
        playTrack,
        togglePlay,
        pause,
        resume,
        next,
        prev,
        seek,
        setVolume,
        toggleMute,
        toggleShuffle,
        cycleRepeatMode,
        addToQueue,
        removeFromQueue,
        clearQueue,
        reorderQueue,
        toggleFavorite,
        toggleDownloadOffline,
        setIsFullscreenOpen,
        setIsQueueOpen,
        setIsLyricsOpen,
        setIsVisualizerActive,
        getFrequencyData,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
}
