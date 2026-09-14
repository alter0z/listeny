import type { Track } from '@/types/music';

/**
 * Parsers for importing playlists from local files:
 *  - CSV (RFC 4180 style), compatible with the Listeny mobile export format:
 *    `Title,Artist,Album,YouTube Video ID`
 *  - M3U / M3U8 playlist files (`#EXTINF:<duration>,<Artist - Title>` + URL lines)
 */

export interface ParsedImportFile {
  format: 'csv' | 'm3u';
  title: string;
  tracks: Track[];
  skipped: number;
}

export interface ImportRow {
  title: string;
  artist: string;
  album?: string;
  videoId: string;
  duration?: number;
}

/** Strips UTF-8 BOM and normalizes line endings. */
function normalizeText(text: string): string {
  return text.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/**
 * Minimal RFC 4180 CSV parser: quoted fields, `""` escaped quotes,
 * commas inside quotes, newlines inside quotes.
 */
export function parseCSV(text: string): string[][] {
  const src = normalizeText(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];

    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      field = '';
      if (row.some((c) => c.trim() !== '')) {
        rows.push(row);
      }
      row = [];
    } else {
      field += ch;
    }
  }

  // Flush trailing row/field
  if (field !== '' || row.length > 0) {
    row.push(field);
    if (row.some((c) => c.trim() !== '')) {
      rows.push(row);
    }
  }

  return rows;
}

/** Extracts a YouTube video ID from a bare ID or any common URL form. */
export function extractVideoId(input: string): string | null {
  if (!input) return null;
  const value = input.trim();

  // Bare 11-char video ID (alphanumerics + _ and -)
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value;

  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
    /\/embed\/([a-zA-Z0-9_-]{11})/,
    /\/live\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const re of patterns) {
    const m = value.match(re);
    if (m) return m[1];
  }

  // An ID embedded anywhere in a longer token (e.g. search result links)
  const loose = value.match(/(?:^|\/|&|v=)([a-zA-Z0-9_-]{11})(?:$|[?&#/])/);
  return loose ? loose[1] : null;
}

export interface RawM3UEntry {
  title?: string;
  artist?: string;
  duration?: number;
  videoId: string;
}

/**
 * Parses M3U / M3U8 content. Handles:
 *  - `#EXTINF:<duration>,<Artist - Title>` entries followed by a URL / ID line
 *  - plain URL-only or bare-ID lists
 *  - `#EXTGRP` / `#PLAYLIST` / comment lines
 */
export function parseM3U(text: string): RawM3UEntry[] {
  const lines = normalizeText(text)
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const entries: RawM3UEntry[] = [];
  let pendingExtInf: { title?: string; artist?: string; duration?: number } | null = null;

  for (const line of lines) {
    if (line.startsWith('#EXTINF:')) {
      const body = line.slice('#EXTINF:'.length);
      const commaIdx = body.indexOf(',');
      const durationRaw = commaIdx >= 0 ? body.slice(0, commaIdx) : body;
      const display = commaIdx >= 0 ? body.slice(commaIdx + 1) : '';

      const parsedDuration = parseInt(durationRaw, 10);
      const duration = isNaN(parsedDuration) ? undefined : parsedDuration;

      // Display names may be "Artist - Title" or just "Title"
      let title = display.trim();
      let artist: string | undefined;
      const splitIdx = title.indexOf(' - ');
      if (splitIdx > 0) {
        artist = title.slice(0, splitIdx).trim();
        title = title.slice(splitIdx + 3).trim();
      }
      pendingExtInf = { title: title || undefined, artist, duration };
      continue;
    }

    if (line.startsWith('#')) continue;

    // A media line — must resolve to a YouTube video ID
    const videoId = extractVideoId(line);
    if (!videoId) continue;

    entries.push({
      title: pendingExtInf?.title,
      artist: pendingExtInf?.artist,
      duration: pendingExtInf?.duration,
      videoId,
    });
    pendingExtInf = null;
  }

  return entries;
}

/** Builds a Track from a parsed import row, with a YouTube thumbnail URL. */
export function rowToTrack(row: ImportRow): Track {
  return {
    id: row.videoId,
    title: row.title || 'Untitled',
    artist: row.artist || 'Unknown Artist',
    album: row.album || undefined,
    duration: row.duration || 0,
    durationFormatted: row.duration ? formatSeconds(row.duration) : '0:00',
    thumbnail: `https://i.ytimg.com/vi/${row.videoId}/mqdefault.jpg`,
    source: 'youtube',
  };
}

function formatSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const ID_HEADER_PATTERNS = [/youtube/i, /video\s*id/i, /\bid\b/i, /url/i];
const TITLE_HEADER_PATTERNS = [/title/i, /track/i, /song/i, /name/i];
const ARTIST_HEADER_PATTERNS = [/artist/i, /author/i, /singer/i];
const ALBUM_HEADER_PATTERNS = [/album/i, /record/i];

interface CsvColumnMap {
  titleIdx: number;
  artistIdx: number;
  albumIdx: number;
  idIdx: number;
}

/**
 * Detects column semantics from a CSV header row (Listeny mobile export:
 * `Title,Artist,Album,YouTube Video ID`). Falls back to positional
 * [title, artist, album, id] when headers are unrecognizable.
 */
export function detectCsvColumns(header: string[]): CsvColumnMap | null {
  const norm = header.map((h, idx) => ({ idx, text: h.trim() }));

  const find = (patterns: RegExp[]) => norm.find((c) => patterns.some((re) => re.test(c.text)));

  const idCol = find(ID_HEADER_PATTERNS);
  const titleCol = find(TITLE_HEADER_PATTERNS);
  const artistCol = find(ARTIST_HEADER_PATTERNS);
  const albumCol = find(ALBUM_HEADER_PATTERNS);

  // Recognizable header: at least an ID column
  if (idCol) {
    if (!titleCol && header.length > 0) return null; // malformed
    return {
      titleIdx: titleCol?.idx ?? 0,
      artistIdx: artistCol?.idx ?? (header.length > 1 ? 1 : 0),
      albumIdx: albumCol?.idx ?? (header.length > 2 ? 2 : 0),
      idIdx: idCol.idx,
    };
  }

  return null;
}

/** Detects which data column holds video IDs when there is no usable header. */
function findIdColumnByContent(rows: string[][]): number | null {
  const sampleRows = rows.slice(0, 20);
  const candidates = new Map<number, number>();

  for (const row of sampleRows) {
    row.forEach((cell, idx) => {
      if (extractVideoId(cell)) {
        candidates.set(idx, (candidates.get(idx) || 0) + 1);
      }
    });
  }

  let bestIdx: number | null = null;
  let bestCount = 0;
  for (const [idx, count] of candidates) {
    if (count > bestCount) {
      bestIdx = idx;
      bestCount = count;
    }
  }

  return bestCount >= Math.max(1, Math.floor(sampleRows.length / 2)) ? bestIdx : null;
}

/** Parses CSV playlists exported by Listeny mobile or similar tools. */
export function parseCsvRows(rows: string[][]): { rows: ImportRow[]; skipped: number } {
  if (rows.length === 0) return { rows: [], skipped: 0 };

  const first = rows[0].map((c) => c.trim());
  let columns = detectCsvColumns(first);
  let dataRows = rows;

  if (!columns) {
    // Maybe there is no header row at all — scan content for ID-like cells
    const idIdx = findIdColumnByContent(rows);
    if (idIdx === null) return { rows: [], skipped: rows.length };
    columns = { titleIdx: 0, artistIdx: 1, albumIdx: 2, idIdx };
    dataRows = rows;
  } else {
    dataRows = rows.slice(1);
  }

  const importRows: ImportRow[] = [];
  let skipped = 0;

  const { titleIdx, artistIdx, albumIdx, idIdx } = columns;

  for (const row of dataRows) {
    if (row.length <= idIdx) {
      skipped++;
      continue;
    }
    const videoId = extractVideoId(row[idIdx] || '');
    if (!videoId) {
      skipped++;
      continue;
    }

    importRows.push({
      title: row[titleIdx]?.trim() || '',
      artist: row[artistIdx]?.trim() || '',
      album: row[albumIdx]?.trim() || undefined,
      videoId,
    });
  }

  return { rows: importRows, skipped };
}

/**
 * Parses an imported file (CSV or M3U/M3U8) into a playlist-ready Track list.
 * Returns the parsed title (derived from filename for CSVs, and from the
 * M3U `#PLAYLIST:` header when present).
 */
export function parseImportFile(filename: string, text: string): ParsedImportFile {
  const name = filename.replace(/\.[^.]+$/, '');
  const lower = filename.toLowerCase();
  const isCsv = lower.endsWith('.csv') || (!lower.endsWith('.m3u') && !lower.endsWith('.m3u8') && text.includes(','));

  const undefinedTitle = /import (playlist|spotify)/i.test(name) ? 'Imported Playlist' : name || 'Imported Playlist';

  if (isCsv) {
    const rows = parseCSV(text);
    const { rows: importRows, skipped } = parseCsvRows(rows);
    return {
      format: 'csv',
      title: undefinedTitle,
      tracks: importRows.map(rowToTrack),
      skipped,
    };
  }

  // M3U / M3U8
  const entries = parseM3U(text);
  const titleMatch = text.match(/^#PLAYLIST:\s*(.+)$/m);
  const tracks: Track[] = entries.map((e) =>
    rowToTrack({
      title: e.title || '',
      artist: e.artist || '',
      videoId: e.videoId,
      duration: e.duration,
    })
  );

  return {
    format: 'm3u',
    title: titleMatch?.[1]?.trim() || undefinedTitle,
    tracks,
    skipped: 0,
  };
}