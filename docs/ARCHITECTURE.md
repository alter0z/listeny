# Listeny Technical Architecture & Engineering Documentation

## 1. System Overview
**Listeny** is a high-performance web music streaming application built on Next.js 15, React 19, TypeScript, Tailwind CSS, and YouTube.js (Innertube). It provides:
- High-fidelity audio streaming via YouTube Music without ads or paywalls.
- Synchronized, real-time karaoke lyrics (LRC timestamps and plain text).
- Hybrid Playlist Import Engine (Spotify fuzzy search & direct YouTube / CSV / M3U import).
- Offline browser storage via IndexedDB.
- Real-time Web Audio API visualizer (64-bin FFT spectrum).
- Full-width Spotify-style desktop player with keyboard shortcuts.

---

## 2. Core Audio Architecture & Browser Compatibility

### 2.1 Muxed MP4 Streaming (Chromium & Safari)
YouTube CDN blocks adaptive audio-only streams (itag 140, 249, 250, 251) with HTTP 403 on server proxies. Listeny uses muxed format (`itag 18`, H.264 video + AAC audio) resolved via `WEB_REMIX` client.

- **Chromium `DECODER_ERROR_NOT_SUPPORTED` Fix**: Standard `new Audio()` in Chromium fails because it attempts to configure video decoders without a video sink. Listeny initializes an `HTMLVideoElement` (`document.createElement('video')`) with `playsInline = true` and `crossOrigin = 'anonymous'`.
- **Safari / WebKit GainNode Routing**: When `AudioContext.createMediaElementSource(element)` is attached, Safari bypasses native `element.volume` and `element.muted`. A `GainNode` is connected between the `AnalyserNode` and `AudioContext.destination`:
  ```
  MediaElementAudioSourceNode -> AnalyserNode -> GainNode -> AudioContext.destination
  ```
  `gainNode.gain.value` is dynamically controlled by `setVolume` and `toggleMute`.

---

## 3. Data & Storage Model

### 3.1 IndexedDB Offline Storage
Listeny uses `idb` with a dedicated database schema `listeny_db` (version 2):
- **`offline_tracks`**: Stores full audio blobs (`audio/mp4`), track metadata, and cache timestamps.
- **`offline_meta`**: Fast index of cached track metadata for instant offline querying.
- **`custom_playlists`**: User-created and imported playlists.
- **`favorites`**: Hearted tracks.
- **`history`**: Last 100 played songs.

### 3.2 Composite React Keys
Tracks in playlists and imports frequently share identical YouTube IDs. All track iterators use composite keys:
```tsx
key={`${track.id}-${idx}`}
```
This guarantees unique DOM reconciliation without React duplicate key warnings.

---

## 4. API Endpoints & Routes

| Endpoint | Method | Description |
|---|---|---|
| `/api/stream/[id]` | GET | Resolves YouTube itag 18 stream and proxies audio bytes with range support |
| `/api/explore` | GET | Fetches curated playlists and quick picks from YouTube Music |
| `/api/search` | GET | Multi-format search across songs, albums, and playlists |
| `/api/lyrics/[id]` | GET | Fetches synchronized LRC lyrics via LRCLIB with fuzzy title matching |
| `/api/import/spotify` | POST | Extracts Spotify playlist tracks and matches them against YouTube Music |
| `/api/import/youtube` | POST | Extracts tracks directly from YouTube/YouTube Music playlist URLs |
| `/api/import/file` | POST | Batch duration resolution for CSV/M3U imported playlists |
| `/api/download/[id]` | GET | Streams track bytes as an attachment with ID3 metadata tags |

---

## 5. UI Layout & Component Tree

```
src/app/page.tsx (flex flex-col h-screen w-screen overflow-hidden)
├── Upper Workspace (flex-1 flex min-h-0 overflow-hidden)
│   ├── Sidebar.tsx (navigation, quick playlists, offline indicators)
│   ├── Main View Area (flex-1 overflow-y-auto)
│   │   ├── ExploreView.tsx (spotlight hero, genres, trending feeds)
│   │   ├── SearchView.tsx (search bar, filter chips, results)
│   │   ├── LibraryView.tsx (favorites, playlists, offline storage, history)
│   │   └── PlaylistDetailView.tsx (hero banner, track table, actions)
│   └── QueueDrawer.tsx (side drawer showing current play queue)
├── Bottom Bar
│   └── PlayerBar.tsx (full-width Spotify-style playback controls, volume, progress, visualizer)
└── Modals & Overlays
    ├── FullscreenPlayer.tsx (cinematic view with synchronized karaoke lyrics)
    └── ImportModal.tsx (Spotify, YouTube, and CSV/M3U playlist importer)
```
