import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Re-attaches sanitized audio to original video.
 * Copies original video stream untouched.
 * Copies subtitles as-is.
 * Outputs same container as input.
 */
export async function muxVideo(
  videoPath: string,
  sanitizedAudioPath: string,
  outputPath: string
): Promise<string> {
  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  await fs.mkdir(outputDir, { recursive: true });

  const inputExt = path.extname(videoPath).toLowerCase();
  const outputExt = path.extname(outputPath).toLowerCase();

  if (inputExt !== outputExt) {
    throw new Error(
      `Input container (${inputExt}) must match output container (${outputExt})`
    );
  }

  return new Promise((resolve, reject) => {
    // Get video duration to ensure sync
    ffmpeg.ffprobe(videoPath, (err, videoMetadata) => {
      if (err) {
        reject(new Error(`Failed to probe video: ${err.message}`));
        return;
      }

      ffmpeg.ffprobe(sanitizedAudioPath, (err, audioMetadata) => {
        if (err) {
          reject(new Error(`Failed to probe audio: ${err.message}`));
          return;
        }

        const videoDuration = videoMetadata.format.duration || 0;
        const audioDuration = audioMetadata.format.duration || 0;

        // Check for significant duration mismatch (more than 0.1 seconds)
        if (Math.abs(videoDuration - audioDuration) > 0.1) {
          reject(
            new Error(
              `Duration mismatch detected! Video: ${videoDuration}s, Audio: ${audioDuration}s. This indicates sync drift.`
            )
          );
          return;
        }

        // Mux video and audio
        ffmpeg(videoPath)
          .input(sanitizedAudioPath)
          .videoCodec('copy') // Copy video stream without re-encoding
          .audioCodec('copy') // Copy audio stream without re-encoding
          .outputOptions([
            '-map 0:v:0', // Map video from first input
            '-map 1:a:0', // Map audio from second input
            '-map 0:s?', // Map subtitles if they exist (optional)
            '-c:s copy', // Copy subtitles
          ])
          .output(outputPath)
          .on('end', () => {
            resolve(outputPath);
          })
          .on('error', (err) => {
            reject(new Error(`Muxing failed: ${err.message}`));
          })
          .run();
      });
    });
  });
}

