'use client';
import React from 'react';
import { Disc3 } from 'lucide-react';
import type { Playlist } from '@/types/music';

interface PlaylistCoverProps {
  playlist: Playlist;
  className?: string;
  iconClassName?: string;
}

export function PlaylistCover({ playlist, className = 'w-full h-full', iconClassName = 'w-8 h-8 text-zinc-600' }: PlaylistCoverProps) {
  const tracks = playlist.tracks || [];
  const validThumbnails = tracks
    .map((t) => t.thumbnail)
    .filter((url): url is string => Boolean(url));

  // If we have at least 4 unique track thumbnails, render a 2x2 collage grid
  if (validThumbnails.length >= 4) {
    const gridThumbs = [validThumbnails[0], validThumbnails[1], validThumbnails[2], validThumbnails[3]];
    return (
      <div className={`grid grid-cols-2 grid-rows-2 bg-[#181820] overflow-hidden ${className}`}>
        {gridThumbs.map((thumb, idx) => (
          <div key={idx} className="relative w-full h-full overflow-hidden bg-[#14141c]">
            <img src={thumb} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    );
  }

  // Fallback to single thumbnail or playlist thumbnail or default icon
  const singleThumb = playlist.thumbnail || (validThumbnails.length > 0 ? validThumbnails[0] : undefined);

  if (singleThumb) {
    return (
      <div className={`relative overflow-hidden bg-[#181820] ${className}`}>
        <img src={singleThumb} alt={playlist.title} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center bg-[#181820] ${className}`}>
      <Disc3 className={iconClassName} />
    </div>
  );
}
