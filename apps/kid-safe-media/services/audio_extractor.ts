import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';

export interface AudioExtractionResult {
  audioPath: string;
  sampleRate: number;
  duration: number;
}

/**
 * Extracts the primary dialogue audio track from a video file.
 * Preserves original sample rate and outputs WAV for processing.
 */
export async function extractAudio(
  videoPath: string,
  outputDir: string
): Promise<AudioExtractionResult> {
  const videoName = path.basename(videoPath, path.extname(videoPath));
  const audioPath = path.join(outputDir, `${videoName}_audio.wav`);

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  return new Promise((resolve, reject) => {
    let sampleRate = 16000; // Default, will be updated from probe
    let duration = 0;

    // First, probe the video to get audio stream info
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(new Error(`Failed to probe video: ${err.message}`));
        return;
      }

      // Find the primary audio stream (usually the first one, or one marked as default)
      const audioStream = metadata.streams.find(
        (s) => s.codec_type === 'audio'
      );

      if (!audioStream) {
        reject(new Error('No audio stream found in video'));
        return;
      }

      sampleRate = audioStream.sample_rate || 16000;
      duration = metadata.format.duration || 0;

      // Extract audio track
      ffmpeg(videoPath)
        .audioCodec('pcm_s16le')
        .audioFrequency(sampleRate)
        .audioChannels(1) // Mono for speech recognition
        .format('wav')
        .output(audioPath)
        .on('end', () => {
          resolve({
            audioPath,
            sampleRate,
            duration,
          });
        })
        .on('error', (err) => {
          reject(new Error(`Audio extraction failed: ${err.message}`));
        })
        .run();
    });
  });
}

