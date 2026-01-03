import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';

export interface MuteInterval {
  start: number;
  end: number;
  word: string;
}

/**
 * Takes original WAV and inserts silence for flagged intervals.
 * Applies padding and preserves total duration exactly.
 * No time stretching, no drift.
 */
export async function silenceAudio(
  audioPath: string,
  muteIntervals: MuteInterval[],
  outputPath: string
): Promise<string> {
  if (muteIntervals.length === 0) {
    // No muting needed, just copy the file
    await fs.copyFile(audioPath, outputPath);
    return outputPath;
  }

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  await fs.mkdir(outputDir, { recursive: true });

  return new Promise((resolve, reject) => {
    // Build ffmpeg filter for silencing intervals
    // Use volume filter with expression that evaluates to 0 when in mute interval, 1 otherwise
    
    // Build expression: if time is in ANY mute interval, return 0, else 1
    let volumeExpr = '1';
    
    if (muteIntervals.length === 1) {
      const iv = muteIntervals[0];
      volumeExpr = `if(between(t,${iv.start},${iv.end}),0,1)`;
    } else if (muteIntervals.length > 1) {
      // Build nested if statements for multiple intervals
      // Start with the last interval and work backwards
      let expr = '1';
      for (let i = muteIntervals.length - 1; i >= 0; i--) {
        const iv = muteIntervals[i];
        expr = `if(between(t,${iv.start},${iv.end}),0,${expr})`;
      }
      volumeExpr = expr;
    }
    
    // Volume filter with expression
    // Note: FFmpeg's volume filter expression syntax
    const filterString = `volume='${volumeExpr}':eval=frame`;

    ffmpeg(audioPath)
      .audioFilters(filterString)
      .audioCodec('pcm_s16le')
      .format('wav')
      .output(outputPath)
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', (err) => {
        reject(new Error(`Audio silencing failed: ${err.message}`));
      })
      .run();
  });
}

