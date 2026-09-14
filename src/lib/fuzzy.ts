/**
 * Port of SpotifyMapper.kt fuzzy matching & normalization logic from Meld Android.
 * Uses Dice's Coefficient (Bigram similarity) + Duration proximity + Artist overlap.
 */

// Common noise patterns in track titles (music videos, remasters, features)
const REMOVE_PATTERNS = [
  /\((?:official\s+)?(?:music\s+)?video\)/gi,
  /\[(?:official\s+)?(?:music\s+)?video\]/gi,
  /\((?:official\s+)?audio\)/gi,
  /\[(?:official\s+)?audio\]/gi,
  /\(lyrics?(?:\s+video)?\)/gi,
  /\[lyrics?(?:\s+video)?\]/gi,
  /\(visualizer\)/gi,
  /\[visualizer\]/gi,
  /\((?:feat\.?|featuring|ft\.?)\s+[^)]+\)/gi,
  /\[(?:feat\.?|featuring|ft\.?)\s+[^\]]+\]/gi,
  /\b(?:feat\.?|featuring|ft\.?)\s+[\w\s&,]+/gi,
  /\((?:[0-9]{4}\s+)?remaster(?:ed)?(?:\s+[0-9]{4})?\)/gi,
  /\[(?:[0-9]{4}\s+)?remaster(?:ed)?(?:\s+[0-9]{4})?\]/gi,
  /\b(?:[0-9]{4}\s+)?remaster(?:ed)?(?:\s+[0-9]{4})?\b/gi,
  /\(deluxe(?:\s+edition)?\)/gi,
  /\[deluxe(?:\s+edition)?\]/gi,
  /\(bonus\s+track\)/gi,
  /\[bonus\s+track\]/gi,
  /\(radio\s+edit\)/gi,
  /\[radio\s+edit\]/gi,
  /\(mono|stereo\)/gi,
  /\[mono|stereo\]/gi,
];

export function normalizeString(str: string): string {
  if (!str) return '';
  let normalized = str.toLowerCase();

  for (const pattern of REMOVE_PATTERNS) {
    normalized = normalized.replace(pattern, ' ');
  }

  // Replace special characters and extra spaces
  normalized = normalized
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized;
}

/**
 * Extracts character bigrams (2-char pairs) from normalized string.
 */
export function getBigrams(str: string): Map<string, number> {
  const bigrams = new Map<string, number>();
  if (str.length < 2) {
    if (str.length === 1) bigrams.set(str, 1);
    return bigrams;
  }

  for (let i = 0; i < str.length - 1; i++) {
    const pair = str.substring(i, i + 2);
    bigrams.set(pair, (bigrams.get(pair) || 0) + 1);
  }

  return bigrams;
}

/**
 * Calculates Dice's coefficient between two strings based on bigrams (0.0 to 1.0).
 */
export function bigramSimilarity(a: string, b: string): number {
  if (!a && !b) return 1.0;
  if (!a || !b) return 0.0;
  if (a === b) return 1.0;

  const normA = normalizeString(a);
  const normB = normalizeString(b);

  if (normA === normB) return 1.0;
  if (!normA || !normB) return 0.0;

  const bigramsA = getBigrams(normA);
  const bigramsB = getBigrams(normB);

  let totalA = 0;
  for (const count of bigramsA.values()) totalA += count;
  let totalB = 0;
  for (const count of bigramsB.values()) totalB += count;

  if (totalA + totalB === 0) return 0.0;

  let intersection = 0;
  for (const [pair, countA] of bigramsA.entries()) {
    if (bigramsB.has(pair)) {
      intersection += Math.min(countA, bigramsB.get(pair)!);
    }
  }

  return (2.0 * intersection) / (totalA + totalB);
}

/**
 * Calculates duration proximity score (0.0 to 1.0).
 */
export function durationScore(targetSec: number, candidateSec: number | null | undefined): number {
  if (!candidateSec || candidateSec <= 0 || targetSec <= 0) return 0.5; // Neutral if duration is unknown

  const diff = Math.abs(targetSec - candidateSec);

  if (diff <= 3) return 1.0;
  if (diff <= 10) return 1.0 - (diff - 3) * 0.03; // 1.0 down to ~0.79
  if (diff <= 25) return 0.79 - (diff - 10) * 0.03; // 0.79 down to ~0.34
  if (diff <= 60) return 0.34 - (diff - 25) * 0.008; // 0.34 down to ~0.06
  return 0.0;
}

/**
 * Computes comprehensive match score (0.0 to 1.0) matching Spotify track to YouTube Music search candidate.
 */
export function calculateMatchScore(
  spotifyTitle: string,
  spotifyArtist: string,
  spotifyDurationMs: number,
  candidateTitle: string,
  candidateArtist: string,
  candidateDurationSec?: number
): number {
  const normSpotifyTitle = normalizeString(spotifyTitle);
  const normCandidateTitle = normalizeString(candidateTitle);
  const normSpotifyArtist = normalizeString(spotifyArtist);
  const normCandidateArtist = normalizeString(candidateArtist);

  const titleScore = bigramSimilarity(normSpotifyTitle, normCandidateTitle);
  const artistScore = bigramSimilarity(normSpotifyArtist, normCandidateArtist);
  const durScore = durationScore(Math.round(spotifyDurationMs / 1000), candidateDurationSec);

  // If title has direct substring match or perfect match
  let titleBonus = 0;
  if (normCandidateTitle.includes(normSpotifyTitle) || normSpotifyTitle.includes(normCandidateTitle)) {
    titleBonus = 0.05;
  }

  // Weightings: Title (45%), Artist (35%), Duration (20%)
  const score = (titleScore + titleBonus) * 0.45 + artistScore * 0.35 + durScore * 0.20;

  return Math.min(1.0, Math.max(0.0, score));
}
