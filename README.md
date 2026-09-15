# Listeny

A modern web-based music streaming application built with Next.js, featuring YouTube Music integration, synchronized lyrics, offline playback, and playlist management.

## About

Listeny is a hybrid music player that combines the best of streaming and local music management. It provides a Spotify-like interface with powerful features:

- 🎵 **YouTube Music Integration** — Stream millions of tracks via YouTube Music's Innertube API
- 🎤 **Synchronized Lyrics** — Real-time karaoke-style lyrics that follow the music
- 📴 **Offline Playback** — Download tracks to your browser for offline listening (IndexedDB)
- 📋 **Playlist Management** — Import from Spotify URLs, YouTube playlists, or CSV files
- 🎨 **Audio Visualizer** — Real-time frequency visualization with Web Audio API
- 🔍 **Smart Search** — Find tracks, artists, and albums instantly
- 💾 **Local Library** — Manage favorites, downloads, and play history
- 🎧 **Full Player Controls** — Queue management, shuffle, repeat modes, seek controls
- 🌙 **Theme Support** — Seamless light/dark mode

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Audio**: Web Audio API, HTMLMediaElement
- **Storage**: IndexedDB (via idb-keyval)
- **Icons**: Lucide React
- **Music Source**: YouTube Music (youtubei.js)

## Architecture Highlights

### Player Context
The audio player is managed through a React context (`AudioPlayerContext.tsx`) that handles:
- Queue state and playback index management
- Media element lifecycle (using `<video>` element for muxed MP4/WebM support)
- Web Audio API integration for visualization and volume control
- Synchronized lyrics tracking
- MediaSession API integration for system media controls

### Format Selection Strategy
YouTube streams are served as **muxed MP4 (itag 18)** via a 3-tier Innertube client fallback:
1. WEB_REMIX (primary)
2. IOS (fallback)
3. DEFAULT (last resort)

This approach avoids adaptive formats that return 403 errors when proxied server-side.

### Key Components
- `PlayerBar.tsx` — Persistent bottom player bar with all controls
- `QueueDrawer.tsx` — Slide-out queue management panel
- `FullscreenPlayer.tsx` — Immersive fullscreen view with lyrics and visualizer
- `ExploreView.tsx` — Discover trending music and curated playlists
- `SearchView.tsx` — Search interface with instant results
- `LibraryView.tsx` — Manage favorites, downloads, and history
- `PlaylistDetailView.tsx` — Playlist track listing and playback

## Getting Started

### Prerequisites
- Node.js 20+
- npm, yarn, pnpm, or bun

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Build for Production

```bash
npm run build
npm start
```

## Recent Fixes

### Queue Playback Bug (2026-09-15)
Fixed critical infinite loop where the player would get stuck on the 2nd track:
- Fixed `handleNextTrack`/`prev` to pass queue parameter to `playTrack`
- Fixed `playTrack` to properly handle existing tracks in queue without index reset
- Fixed QueueDrawer to only show upcoming tracks (filter by index, not ID)
- Fixed `removeFromQueue` stale closure bug

See commit `b2bc271` for details.

## Project Structure

```
meld-web/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── api/          # API routes (stream, search, lyrics, etc.)
│   │   ├── layout.tsx    # Root layout with AudioPlayerProvider
│   │   └── page.tsx      # Main application shell
│   ├── components/       # React components
│   │   ├── PlayerBar.tsx
│   │   ├── QueueDrawer.tsx
│   │   ├── FullscreenPlayer.tsx
│   │   ├── ExploreView.tsx
│   │   ├── SearchView.tsx
│   │   └── ...
│   ├── context/          # React contexts
│   │   └── AudioPlayerContext.tsx
│   ├── lib/              # Utility libraries
│   │   ├── innertube.ts  # YouTube Music API client
│   │   ├── storage.ts    # IndexedDB persistence
│   │   ├── spotify.ts    # Spotify playlist import
│   │   └── fileImport.ts # CSV/file import utilities
│   └── types/            # TypeScript type definitions
│       └── music.ts
├── public/               # Static assets
└── docs/                 # Documentation
    └── ARCHITECTURE.md
```

## Known Browser Quirks

### Safari Web Audio Volume
Safari/WebKit ignores `HTMLMediaElement.volume` when using `createMediaElementSource`. A `GainNode` is required for volume control.

### Chromium Muxed Playback
Chromium throws `DECODER_ERROR_NOT_SUPPORTED` on muxed MP4/WebM when using `new Audio()`. Use `document.createElement('video')` instead.

## Contributing

This is a personal project, but suggestions and bug reports are welcome! Please check existing issues before creating new ones.

## License

Private - All Rights Reserved

## Acknowledgments

- YouTube Music for the music catalog
- [youtubei.js](https://github.com/LuanRT/YouTube.js) for the Innertube client
- Lucide for the icon set
- The Next.js and React teams
