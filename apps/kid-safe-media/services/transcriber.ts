import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = true;

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

/**
 * Performs local speech-to-text with word-level timestamps.
 * Uses Whisper model from @xenova/transformers for offline processing.
 */
export async function transcribeAudio(
  audioPath: string
): Promise<WordTimestamp[]> {
  console.log('Loading Whisper model...');
  
  // Use a smaller model for faster processing (whisper-tiny.en)
  // For better accuracy, use 'Xenova/whisper-small' or 'Xenova/whisper-base'
  const transcriber = await pipeline(
    'automatic-speech-recognition',
    'Xenova/whisper-tiny.en',
    {
      chunk_length_s: 30,
      stride_length_s: 5,
    }
  );

  console.log('Transcribing audio...');
  
  // Transcribe with timestamps
  const result = await transcriber(audioPath, {
    return_timestamps: 'word',
    chunk_length_s: 30,
    stride_length_s: 5,
  });

  // Convert to our format
  const wordTimestamps: WordTimestamp[] = [];
  
  // The result structure depends on return_timestamps setting
  // With 'word', we should get chunks with word-level timestamps
  if (result.chunks && Array.isArray(result.chunks)) {
    for (const chunk of result.chunks) {
      // Check if chunk has word-level timestamps
      if (chunk.words && Array.isArray(chunk.words)) {
        // Word-level timestamps available
        for (const wordData of chunk.words) {
          const word = wordData.word?.toLowerCase().replace(/[^\w]/g, '') || '';
          if (word) {
            wordTimestamps.push({
              word,
              start: wordData.timestamp?.[0] || 0,
              end: wordData.timestamp?.[1] || 0,
              confidence: wordData.probability || 0.9,
            });
          }
        }
      } else if (chunk.timestamp && chunk.text) {
        // Chunk-level timestamps, need to estimate word positions
        const words = chunk.text.split(/\s+/).filter(w => w.trim());
        const chunkStart = chunk.timestamp[0];
        const chunkEnd = chunk.timestamp[1];
        const chunkDuration = chunkEnd - chunkStart;
        const wordDuration = words.length > 0 ? chunkDuration / words.length : 0;
        
        words.forEach((word: string, index: number) => {
          const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
          if (cleanWord) {
            wordTimestamps.push({
              word: cleanWord,
              start: chunkStart + index * wordDuration,
              end: chunkStart + (index + 1) * wordDuration,
              confidence: 0.9,
            });
          }
        });
      }
    }
  } else if (result.text) {
    // Fallback: no timestamps available, this shouldn't happen with return_timestamps='word'
    console.warn('No timestamp chunks found in result');
    throw new Error('Word-level timestamps not available. Transcription may have failed.');
  }

  console.log(`Transcribed ${wordTimestamps.length} words`);
  return wordTimestamps;
}

