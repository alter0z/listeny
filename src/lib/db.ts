import fs from 'node:fs';
import path from 'node:path';
import type { Playlist, Track } from '@/types/music';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface UserAccount {
  username: string;
  name: string;
  avatar?: string;
  createdAt: number;
}

export interface ServerPlaylist extends Playlist {
  userId: string; // owner username
}

interface DatabaseSchema {
  users: UserAccount[];
  playlists: ServerPlaylist[];
}

function ensureDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial: DatabaseSchema = {
        users: [
          { username: 'default', name: 'Default User', createdAt: Date.now() }
        ],
        playlists: []
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Failed to read db.json:', err);
    return { users: [{ username: 'default', name: 'Default User', createdAt: Date.now() }], playlists: [] };
  }
}

function saveDb(data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write db.json:', err);
  }
}

export function getUsers(): UserAccount[] {
  const db = ensureDb();
  return db.users;
}

export function getUserByUsername(username: string): UserAccount | undefined {
  const db = ensureDb();
  return db.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
}

export function registerOrGetUser(username: string, name?: string): UserAccount {
  const db = ensureDb();
  const cleanUsername = (username || 'default').trim().toLowerCase();
  let user = db.users.find((u) => u.username.toLowerCase() === cleanUsername);
  if (!user) {
    user = {
      username: cleanUsername,
      name: name || username,
      createdAt: Date.now(),
    };
    db.users.push(user);
    saveDb(db);
  }
  return user;
}

export function getPlaylistsForUser(userId: string): ServerPlaylist[] {
  const db = ensureDb();
  const cleanId = (userId || 'default').trim().toLowerCase();
  return db.playlists.filter((p) => (p.userId || 'default').toLowerCase() === cleanId);
}

export function savePlaylistForUser(userId: string, playlist: Playlist): ServerPlaylist[] {
  const db = ensureDb();
  const cleanId = (userId || 'default').trim().toLowerCase();

  const existingIdx = db.playlists.findIndex(
    (p) => p.id === playlist.id && (p.userId || 'default').toLowerCase() === cleanId
  );

  const serverPlaylist: ServerPlaylist = {
    ...playlist,
    userId: cleanId,
    updatedAt: Date.now(),
    createdAt: playlist.createdAt || Date.now(),
  };

  if (existingIdx >= 0) {
    db.playlists[existingIdx] = serverPlaylist;
  } else {
    db.playlists.unshift(serverPlaylist);
  }

  saveDb(db);
  return getPlaylistsForUser(cleanId);
}

export function deletePlaylistForUser(userId: string, playlistId: string): ServerPlaylist[] {
  const db = ensureDb();
  const cleanId = (userId || 'default').trim().toLowerCase();

  db.playlists = db.playlists.filter(
    (p) => !(p.id === playlistId && (p.userId || 'default').toLowerCase() === cleanId)
  );

  saveDb(db);
  return getPlaylistsForUser(cleanId);
}
