import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Profile {
  profile: string;
  mute_words: string[];
  mute_phrases: string[];
  skip_scene_words?: string[];
  skip_scene_phrases?: string[];
  skip_scene_padding_seconds?: number;
  min_confidence: number;
  padding_ms: number;
}

export interface MuteInterval {
  start: number;
  end: number;
  word: string;
}

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

/**
 * Loads a profile JSON file and matches profanity against word timestamps.
 * Returns list of mute intervals with padding applied.
 */
export function loadProfile(profileName: string): Profile {
  const profilePath = path.join(
    __dirname,
    '..',
    'profiles',
    `${profileName}.json`
  );

  try {
    const profileData = readFileSync(profilePath, 'utf-8');
    return JSON.parse(profileData) as Profile;
  } catch (error) {
    throw new Error(
      `Failed to load profile '${profileName}': ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Detects profanity in word timestamps based on profile rules.
 * Matches exact words and multi-word phrases, respects confidence threshold.
 */
export function detectProfanity(
  wordTimestamps: WordTimestamp[],
  profile: Profile
): MuteInterval[] {
  const muteIntervals: MuteInterval[] = [];
  const muteWordsSet = new Set(
    profile.mute_words.map((w) => w.toLowerCase())
  );
  const mutePhrases = profile.mute_phrases.map((p) =>
    p.toLowerCase().split(/\s+/)
  );

  // Check individual words
  for (const wordTs of wordTimestamps) {
    if (wordTs.confidence < profile.min_confidence) {
      continue;
    }

    const wordLower = wordTs.word.toLowerCase();
    if (muteWordsSet.has(wordLower)) {
      muteIntervals.push({
        start: wordTs.start - profile.padding_ms / 1000,
        end: wordTs.end + profile.padding_ms / 1000,
        word: wordTs.word,
      });
    }
  }

  // Check multi-word phrases
  for (let i = 0; i < wordTimestamps.length; i++) {
    for (const phrase of mutePhrases) {
      if (i + phrase.length > wordTimestamps.length) {
        continue;
      }

      // Check if phrase matches
      let matches = true;
      for (let j = 0; j < phrase.length; j++) {
        const wordTs = wordTimestamps[i + j];
        if (
          wordTs.word.toLowerCase() !== phrase[j] ||
          wordTs.confidence < profile.min_confidence
        ) {
          matches = false;
          break;
        }
      }

      if (matches) {
        const startWord = wordTimestamps[i];
        const endWord = wordTimestamps[i + phrase.length - 1];
        muteIntervals.push({
          start: startWord.start - profile.padding_ms / 1000,
          end: endWord.end + profile.padding_ms / 1000,
          word: phrase.join(' '),
        });
      }
    }
  }

  // Merge overlapping intervals
  const merged = mergeIntervals(muteIntervals);

  return merged;
}

/**
 * Merges overlapping mute intervals to avoid redundant processing.
 */
function mergeIntervals(intervals: MuteInterval[]): MuteInterval[] {
  if (intervals.length === 0) {
    return [];
  }

  // Sort by start time
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged: MuteInterval[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (current.start <= last.end) {
      // Overlapping, merge
      last.end = Math.max(last.end, current.end);
    } else {
      // Non-overlapping, add new interval
      merged.push(current);
    }
  }

  return merged;
}

