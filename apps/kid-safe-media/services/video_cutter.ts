import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';

export interface SceneInterval {
  start: number;
  end: number;
  reason: string;
}

/**
 * Cuts out specified scene intervals from video.
 * Uses FFmpeg's concat demuxer to join the remaining segments.
 */
export async function cutScenes(
  videoPath: string,
  sceneIntervals: SceneInterval[],
  outputPath: string
): Promise<string> {
  if (sceneIntervals.length === 0) {
    // No scenes to cut, just copy the file
    await fs.copyFile(videoPath, outputPath);
    return outputPath;
  }

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  await fs.mkdir(outputDir, { recursive: true });

  // Get video duration first
  const duration = await new Promise<number>((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(new Error(`Failed to probe video: ${err.message}`));
        return;
      }
      resolve(metadata.format.duration || 0);
    });
  });

  // Sort intervals by start time
  const sortedIntervals = [...sceneIntervals].sort((a, b) => a.start - b.start);

  // Build list of segments to keep (everything except the cut intervals)
  const segments: Array<{ start: number; end: number }> = [];
  let currentStart = 0;

  for (const interval of sortedIntervals) {
    // If there's a gap before this interval, add it as a segment to keep
    if (interval.start > currentStart) {
      segments.push({
        start: currentStart,
        end: Math.min(interval.start, duration),
      });
    }
    // Move current start to after this interval
    currentStart = Math.max(currentStart, interval.end);
  }

  // Add final segment if there's content after the last interval
  if (currentStart < duration) {
    segments.push({
      start: currentStart,
      end: duration,
    });
  }

  // If no segments to keep (everything was cut), return error
  if (segments.length === 0) {
    throw new Error('All video content would be removed. Cannot create output.');
  }

  // If only one segment, use simple trim
  if (segments.length === 1) {
    const segment = segments[0];
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .seekInput(segment.start)
        .duration(segment.end - segment.start)
        .videoCodec('copy')
        .audioCodec('copy')
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (err) =>
          reject(new Error(`Video cutting failed: ${err.message}`))
        )
        .run();
    });
  }

  // Multiple segments: use filter_complex with concat
  // Create a filter that selects only the segments we want
  const tempDir = path.join(outputDir, '.temp_cut');
  await fs.mkdir(tempDir, { recursive: true });

  try {
    // Extract each segment
    const segmentFiles: string[] = [];
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const segmentFile = path.join(tempDir, `segment_${i}.mp4`);
      segmentFiles.push(segmentFile);

      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .seekInput(segment.start)
          .duration(segment.end - segment.start)
          .videoCodec('copy')
          .audioCodec('copy')
          .output(segmentFile)
          .on('end', () => resolve())
          .on('error', (err) =>
            reject(new Error(`Failed to extract segment ${i}: ${err.message}`))
          )
          .run();
      });
    }

    // Create concat file list (use absolute paths)
    const concatFile = path.join(tempDir, 'concat.txt');
    const concatContent = segmentFiles
      .map((file) => {
        // Use absolute path and escape single quotes
        const absPath = path.resolve(file);
        return `file '${absPath.replace(/'/g, "'\\''")}'`;
      })
      .join('\n');
    await fs.writeFile(concatFile, concatContent);

    // Concatenate segments
    return new Promise((resolve, reject) => {
      ffmpeg(concatFile)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .videoCodec('copy')
        .audioCodec('copy')
        .output(outputPath)
        .on('end', () => {
          // Cleanup temp files
          fs.rm(tempDir, { recursive: true, force: true }).catch(() => {
            // Ignore cleanup errors
          });
          resolve(outputPath);
        })
        .on('error', (err) => {
          // Cleanup on error
          fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
          reject(new Error(`Video concatenation failed: ${err.message}`));
        })
        .run();
    });
  } catch (error) {
    // Cleanup on error
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    throw error;
  }
}

