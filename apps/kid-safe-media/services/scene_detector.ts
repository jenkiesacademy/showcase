import { Profile, WordTimestamp } from './profanity_detector.js';

export interface SceneInterval {
  start: number;
  end: number;
  reason: string;
}

/**
 * Detects scenes with sexual references based on profile rules.
 * Returns intervals that should be completely removed from the video.
 */
export function detectSexualScenes(
  wordTimestamps: WordTimestamp[],
  profile: Profile
): SceneInterval[] {
  const skipScenes: SceneInterval[] = [];
  
  // If profile doesn't have skip_scene settings, return empty
  if (!profile.skip_scene_words && !profile.skip_scene_phrases) {
    return skipScenes;
  }

  const skipWords = profile.skip_scene_words || [];
  const skipPhrases = profile.skip_scene_phrases || [];
  const paddingSeconds = profile.skip_scene_padding_seconds || 5;

  const skipWordsSet = new Set(skipWords.map((w) => w.toLowerCase()));
  const skipPhrasesList = skipPhrases.map((p) => p.toLowerCase().split(/\s+/));

  // Check individual words
  for (const wordTs of wordTimestamps) {
    if (wordTs.confidence < profile.min_confidence) {
      continue;
    }

    const wordLower = wordTs.word.toLowerCase();
    
    // Check if word matches any skip word (including partial matches for words like "masturbat")
    for (const skipWord of skipWordsSet) {
      if (wordLower.includes(skipWord) || skipWord.includes(wordLower)) {
        skipScenes.push({
          start: Math.max(0, wordTs.start - paddingSeconds),
          end: wordTs.end + paddingSeconds,
          reason: `sexual reference: "${wordTs.word}"`,
        });
        break;
      }
    }
  }

  // Check multi-word phrases
  for (let i = 0; i < wordTimestamps.length; i++) {
    for (const phrase of skipPhrasesList) {
      if (i + phrase.length > wordTimestamps.length) {
        continue;
      }

      // Check if phrase matches
      let matches = true;
      for (let j = 0; j < phrase.length; j++) {
        const wordTs = wordTimestamps[i + j];
        const wordLower = wordTs.word.toLowerCase();
        const phraseWord = phrase[j];
        
        // Allow partial matches for phrase words
        if (
          (!wordLower.includes(phraseWord) && !phraseWord.includes(wordLower)) ||
          wordTs.confidence < profile.min_confidence
        ) {
          matches = false;
          break;
        }
      }

      if (matches) {
        const startWord = wordTimestamps[i];
        const endWord = wordTimestamps[i + phrase.length - 1];
        skipScenes.push({
          start: Math.max(0, startWord.start - paddingSeconds),
          end: endWord.end + paddingSeconds,
          reason: `sexual phrase: "${phrase.join(' ')}"`,
        });
      }
    }
  }

  // Merge overlapping intervals
  const merged = mergeSceneIntervals(skipScenes);

  return merged;
}

/**
 * Merges overlapping scene intervals to avoid redundant processing.
 */
function mergeSceneIntervals(intervals: SceneInterval[]): SceneInterval[] {
  if (intervals.length === 0) {
    return [];
  }

  // Sort by start time
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged: SceneInterval[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    // Merge if overlapping or very close (within 1 second)
    if (current.start <= last.end + 1) {
      // Overlapping or close, merge
      last.end = Math.max(last.end, current.end);
      last.reason = `${last.reason}; ${current.reason}`;
    } else {
      // Non-overlapping, add new interval
      merged.push(current);
    }
  }

  return merged;
}

