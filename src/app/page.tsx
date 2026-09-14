'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { Playlist } from '@/types/music';
import { getSavedPlaylists, getOfflineTracksIndex } from '@/lib/storage';

import { Sidebar } from '@/components/Sidebar';
import { PlayerBar } from '@/components/PlayerBar';
import { ExploreView } from '@/components/ExploreView';
import { SearchView } from '@/components/SearchView';
import { LibraryView } from '@/components/LibraryView';
import { PlaylistDetailView } from '@/components/PlaylistDetailView';
import { QueueDrawer } from '@/components/QueueDrawer';
import { FullscreenPlayer } from '@/components/FullscreenPlayer';
import { ImportModal } from '@/components/ImportModal';

export default function Home() {
  const [currentView, setCurrentView] = useState<'explore' | 'search' | 'library' | 'downloads' | 'playlist_detail'>('explore');
  const [searchQuery, setSearchQuery] = useState('');
  const [libraryTab, setLibraryTab] = useState<'favorites' | 'playlists' | 'downloads' | 'history'>('favorites');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [offlineCount, setOfflineCount] = useState(0);

  const refreshSidebarData = useCallback(async () => {
    try {
      const [saved, offline] = await Promise.all([
        getSavedPlaylists(),
        getOfflineTracksIndex(),
      ]);
      setPlaylists(saved);
      setOfflineCount(offline.length);
    } catch (err) {
      console.error('Failed to load sidebar data:', err);
    }
  }, []);

  useEffect(() => {
    refreshSidebarData();
  }, [refreshSidebarData]);

  // Handle selecting a playlist from anywhere (Explore, Search, Library, Sidebar)
  const handleSelectPlaylist = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setCurrentView('playlist_detail');
  };

  // Handle genre click from ExploreView
  const handleSearchGenre = (genre: string) => {
    setSearchQuery(genre);
    setCurrentView('search');
  };

  // Handle sidebar view navigation
  const handleViewChange = (view: string) => {
    if (view === 'downloads') {
      setLibraryTab('downloads');
      setCurrentView('library');
    } else if (view === 'explore' || view === 'search' || view === 'library') {
      if (view === 'library') {
        setLibraryTab('favorites');
      }
      setCurrentView(view);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#070709] text-white select-none">
      {/* Top Workspace: Sidebar + Main Views + Queue Drawer */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        <Sidebar
          currentView={currentView === 'library' && libraryTab === 'downloads' ? 'downloads' : currentView}
          setCurrentView={handleViewChange}
          playlists={playlists}
          onSelectPlaylist={handleSelectPlaylist}
          onOpenImport={() => setIsImportModalOpen(true)}
          offlineCount={offlineCount}
        />

        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#0a0a0f] relative">
          {currentView === 'explore' && (
            <ExploreView
              onSelectPlaylist={handleSelectPlaylist}
              onSearchGenre={handleSearchGenre}
              onOpenImport={() => setIsImportModalOpen(true)}
            />
          )}

          {currentView === 'search' && (
            <SearchView
              initialQuery={searchQuery}
              onSelectPlaylist={handleSelectPlaylist}
            />
          )}

          {currentView === 'library' && (
            <LibraryView
              initialTab={libraryTab}
              onSelectPlaylist={handleSelectPlaylist}
              onOpenImport={() => setIsImportModalOpen(true)}
            />
          )}

          {currentView === 'playlist_detail' && selectedPlaylist && (
            <PlaylistDetailView
              playlist={selectedPlaylist}
              onBack={() => setCurrentView('explore')}
              onPlaylistUpdated={refreshSidebarData}
            />
          )}
        </main>

        <QueueDrawer />
      </div>

      {/* Bottom Full-Width Spotify-Style Player */}
      <PlayerBar />

      {/* Overlays / Modals */}
      <FullscreenPlayer />
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onPlaylistSaved={() => {
          refreshSidebarData();
          setCurrentView('library');
          setLibraryTab('playlists');
        }}
      />
    </div>
  );
}
