#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import { promises as fs } from 'fs';
import { extractAudio } from './services/audio_extractor.js';
import { transcribeAudio } from './services/transcriber.js';
import { loadProfile, detectProfanity } from './services/profanity_detector.js';
import { detectSexualScenes } from './services/scene_detector.js';
import { silenceAudio } from './services/audio_silencer.js';
import { cutScenes } from './services/video_cutter.js';
import { muxVideo } from './services/muxer.js';

const program = new Command();

program
  .name('sanitize')
  .description('Generate kid-safe versions of movies by silencing profanity')
  .version('1.0.0')
  .requiredOption('-i, --input <path>', 'Input video file path (.mp4 or .mkv)')
  .requiredOption('-p, --profile <name>', 'Profile name (e.g., toddler, pg)')
  .requiredOption('-o, --output <path>', 'Output directory for Plex-ready files')
  .parse(process.argv);

const options = program.opts();

async function sanitize() {
  const inputPath = path.resolve(options.input);
  const outputDir = path.resolve(options.output);
  const profileName = options.profile;

  console.log('Kid-Safe Media Sanitizer');
  console.log('========================');
  console.log(`Input: ${inputPath}`);
  console.log(`Profile: ${profileName}`);
  console.log(`Output: ${outputDir}`);
  console.log('');

  // Validate input file exists
  try {
    await fs.access(inputPath);
  } catch {
    console.error(`Error: Input file not found: ${inputPath}`);
    process.exit(1);
  }

  // Validate profile exists
  let profile;
  try {
    profile = loadProfile(profileName);
    console.log(`Loaded profile: ${profile.profile}`);
    console.log(`Mute words: ${profile.mute_words.length}`);
    console.log(`Mute phrases: ${profile.mute_phrases.length}`);
    if (profile.skip_scene_words || profile.skip_scene_phrases) {
      console.log(`Skip scene words: ${profile.skip_scene_words?.length || 0}`);
      console.log(`Skip scene phrases: ${profile.skip_scene_phrases?.length || 0}`);
    }
    console.log('');
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : 'Failed to load profile'}`);
    process.exit(1);
  }

  // Create temp directory for processing
  const tempDir = path.join(outputDir, '.temp');
  await fs.mkdir(tempDir, { recursive: true });

  try {
    // Step 1: Extract audio
    console.log('Step 1/7: Extracting audio track...');
    const { audioPath, sampleRate, duration } = await extractAudio(inputPath, tempDir);
    console.log(`✓ Audio extracted: ${sampleRate}Hz, ${duration.toFixed(2)}s`);
    console.log('');

    // Step 2: Transcribe
    console.log('Step 2/7: Transcribing audio (this may take a while)...');
    const wordTimestamps = await transcribeAudio(audioPath);
    console.log(`✓ Transcription complete: ${wordTimestamps.length} words`);
    console.log('');

    // Step 3: Detect profanity (for muting)
    console.log('Step 3/7: Detecting profanity...');
    const muteIntervals = detectProfanity(wordTimestamps, profile);
    console.log(`✓ Found ${muteIntervals.length} profanity instances to mute`);
    if (muteIntervals.length > 0) {
      console.log('  Muted words/phrases:');
      muteIntervals.forEach((iv, i) => {
        console.log(`    ${i + 1}. "${iv.word}" at ${iv.start.toFixed(2)}s - ${iv.end.toFixed(2)}s`);
      });
    }
    console.log('');

    // Step 4: Detect sexual scenes (for cutting)
    console.log('Step 4/7: Detecting sexual scenes...');
    const sceneIntervals = detectSexualScenes(wordTimestamps, profile);
    console.log(`✓ Found ${sceneIntervals.length} scenes to skip`);
    if (sceneIntervals.length > 0) {
      console.log('  Skipped scenes:');
      sceneIntervals.forEach((iv, i) => {
        const duration = iv.end - iv.start;
        console.log(`    ${i + 1}. ${iv.start.toFixed(2)}s - ${iv.end.toFixed(2)}s (${duration.toFixed(2)}s): ${iv.reason}`);
      });
    }
    console.log('');

    // Step 5: Cut scenes from video (if any)
    let videoToUse = inputPath;
    if (sceneIntervals.length > 0) {
      console.log('Step 5/7: Cutting sexual scenes from video...');
      const cutVideoPath = path.join(tempDir, 'cut_video.mp4');
      await cutScenes(inputPath, sceneIntervals, cutVideoPath);
      videoToUse = cutVideoPath;
      console.log('✓ Scenes cut from video');
      console.log('');
    } else {
      console.log('Step 5/7: No scenes to cut, skipping...');
      console.log('');
    }

    // Step 6: Silence profanity in audio
    console.log('Step 6/7: Silencing profanity...');
    const sanitizedAudioPath = path.join(tempDir, 'sanitized_audio.wav');
    await silenceAudio(audioPath, muteIntervals, sanitizedAudioPath);
    console.log('✓ Audio sanitized');
    console.log('');

    // Step 7: Mux sanitized audio with (possibly cut) video
    console.log('Step 7/7: Muxing sanitized audio with video...');
    const inputName = path.basename(inputPath, path.extname(inputPath));
    const inputExt = path.extname(inputPath);
    
    // Generate Plex-compatible filename: "Movie Name (Year) - Kid Safe [Profile].ext"
    // Extract year if present in filename (common pattern: "Movie (2023)")
    const yearMatch = inputName.match(/\((\d{4})\)/);
    const year = yearMatch ? yearMatch[1] : '';
    const baseName = inputName.replace(/\s*\(\d{4}\)\s*/, '').trim();
    const outputName = year
      ? `${baseName} (${year}) - Kid Safe [${profileName.charAt(0).toUpperCase() + profileName.slice(1)}]${inputExt}`
      : `${baseName} - Kid Safe [${profileName.charAt(0).toUpperCase() + profileName.slice(1)}]${inputExt}`;
    
    const outputPath = path.join(outputDir, outputName);
    await muxVideo(videoToUse, sanitizedAudioPath, outputPath);
    console.log('✓ Video muxed');
    console.log('');

    // Cleanup temp files
    console.log('Cleaning up temporary files...');
    await fs.rm(tempDir, { recursive: true, force: true });
    console.log('✓ Cleanup complete');
    console.log('');

    console.log('================================');
    console.log('✓ Sanitization complete!');
    console.log(`Output file: ${outputPath}`);
    console.log(`Muted ${muteIntervals.length} profanity instances`);
    if (sceneIntervals.length > 0) {
      const totalCutTime = sceneIntervals.reduce((sum, iv) => sum + (iv.end - iv.start), 0);
      console.log(`Skipped ${sceneIntervals.length} scenes (${totalCutTime.toFixed(2)}s total)`);
    }
    console.log('================================');
  } catch (error) {
    console.error('');
    console.error('Error during sanitization:');
    console.error(error instanceof Error ? error.message : String(error));
    
    // Cleanup on error
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
    
    process.exit(1);
  }
}

sanitize();

