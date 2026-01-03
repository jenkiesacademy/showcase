# Kid-Safe Media Sanitizer

A **local-only tool** that generates kid-safe versions of movies and TV episodes by surgically silencing profanity in the audio track. Fully offline, Plex-compatible, and designed to preserve exact video timing with no lip-sync drift.

## Features

- ✅ **Fully Offline** - No cloud APIs required
- ✅ **Surgical Silence** - Only mutes profanity, not entire sentences
- ✅ **Scene Skipping** - Automatically removes scenes with sexual references
- ✅ **Multiple Profiles** - Toddler, PG, and custom profiles
- ✅ **Plex-Compatible** - Automatically recognized as alternate versions
- ✅ **Preserves Timing** - No lip-sync issues, exact duration matching
- ✅ **GUI & CLI** - Both graphical and command-line interfaces
- ✅ **Cross-Platform** - Windows executable and Mac DMG support

## Requirements

- **FFmpeg** - Must be installed and available in PATH
  - Windows: Download from [ffmpeg.org](https://ffmpeg.org/download.html)
  - Mac: `brew install ffmpeg`
  - Linux: `sudo apt-get install ffmpeg` or `sudo yum install ffmpeg`

- **Node.js** 18+ (for development/building)

## Installation

### For End Users (Pre-built Executables)

1. Download the appropriate package for your OS:
   - **Windows**: `Kid Safe Media Sanitizer Setup.exe` (from `release/` folder)
   - **Mac**: `Kid Safe Media Sanitizer.dmg` (from `release/` folder)

2. Install and run the application

### For Developers

```bash
# Clone or navigate to the project
cd kid-safe-media

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run CLI
npm start -- -i "path/to/video.mkv" -p toddler -o "path/to/output"

# Or run Electron GUI
npm run electron:dev
```

## Usage

### GUI Mode (Recommended)

1. Launch the application
2. Click "Browse" to select your input video file (.mp4 or .mkv)
3. Click "Browse" to select your output folder (Plex media location)
4. Select a profile (Toddler, PG, etc.)
5. Click "Start Sanitization"
6. Wait for processing to complete
7. Find your kid-safe video in the output folder

### CLI Mode

```bash
sanitize \
  --input "/path/to/Movie.mkv" \
  --profile toddler \
  --output "/path/to/plex_ready/"
```

**Options:**
- `-i, --input <path>` - Input video file (.mp4 or .mkv) - **Required**
- `-p, --profile <name>` - Profile name (toddler, pg) - **Required**
- `-o, --output <path>` - Output directory - **Required**

## Profiles

Profiles define which words and phrases to mute. They are stored in the `profiles/` directory.

### Available Profiles

- **toddler** - Most restrictive, mutes common profanity and mild language
- **pg** - Less restrictive, only mutes strong profanity

### Profile Structure

```json
{
  "profile": "toddler",
  "mute_words": ["damn", "hell", "shit", "fuck"],
  "mute_phrases": ["shut up", "oh my god"],
  "skip_scene_words": ["sex", "naked", "sexual"],
  "skip_scene_phrases": ["make love", "have sex"],
  "skip_scene_padding_seconds": 5,
  "min_confidence": 0.85,
  "padding_ms": 120
}
```

- `mute_words` - Individual words to mute
- `mute_phrases` - Multi-word phrases to mute
- `skip_scene_words` - Words that trigger scene removal (optional)
- `skip_scene_phrases` - Phrases that trigger scene removal (optional)
- `skip_scene_padding_seconds` - Seconds to pad before/after sexual scenes (optional)
- `min_confidence` - Minimum transcription confidence (0.0-1.0)
- `padding_ms` - Milliseconds of silence before/after each muted word

### Creating Custom Profiles

1. Copy an existing profile from `profiles/`
2. Modify the `mute_words` and `mute_phrases` arrays
3. Save with a new name (e.g., `custom.json`)
4. Use it with `--profile custom`

## Plex Compatibility

The tool generates files with Plex-compatible naming:

```
Movie Name (Year) - Kid Safe [Profile].mkv
```

Plex will automatically recognize these as alternate versions and show them in the "Play Version" menu:

- ▶ Play Version
  - Original
  - Kid Safe – Toddler

**Requirements for Plex recognition:**
- Runtime matches original
- Container format matches original
- Filename similarity (same base name)

## How It Works

1. **Extract Audio** - Extracts primary dialogue track as WAV
2. **Transcribe** - Uses local Whisper model for speech-to-text with word-level timestamps
3. **Detect Profanity** - Matches words/phrases against selected profile (for muting)
4. **Detect Sexual Scenes** - Identifies scenes with sexual references (for cutting)
5. **Cut Scenes** - Removes sexual scenes from video entirely
6. **Silence Audio** - Applies silence to flagged profanity intervals with padding
7. **Mux Video** - Re-attaches sanitized audio to cut video

## Building Executables

### Windows Executable

```bash
npm run electron:build:win
```

Output: `release/Kid Safe Media Sanitizer Setup.exe`

### Mac DMG

```bash
npm run electron:build:mac
```

Output: `release/Kid Safe Media Sanitizer.dmg`

### CLI-only Executables (pkg)

```bash
# Windows
npm run package:win

# Mac
npm run package:mac
```

## Troubleshooting

### "FFmpeg not found"
- Ensure FFmpeg is installed and in your PATH
- Test with: `ffmpeg -version`

### "No audio stream found"
- The video file may not have an audio track
- Try a different video file

### "Duration mismatch detected"
- This indicates sync drift (shouldn't happen)
- Report as a bug with the video file details

### Slow transcription
- First run downloads the Whisper model (~75MB)
- Transcription speed depends on video length and CPU
- Consider using a faster model in `services/transcriber.ts`

### Low profanity detection
- Check profile settings (`min_confidence` may be too high)
- Verify words are in the profile's `mute_words` array
- Transcription accuracy depends on audio quality

## Technical Details

- **Audio Processing**: FFmpeg (pcm_s16le, WAV)
- **Speech Recognition**: @xenova/transformers (Whisper-tiny.en)
- **Video Muxing**: FFmpeg (stream copy, no re-encoding)
- **GUI Framework**: Electron
- **Language**: TypeScript

## Limitations

- Processing time: ~1-2x video duration (depends on CPU)
- First run: Downloads Whisper model (~75MB)
- Audio only: Does not modify video content
- Local only: Requires local processing (no cloud)

## Phase 2 (Not Yet Implemented)

- Subtitle profanity sanitization
- Severity tiers per word
- Batch season processing
- Violence detection
- Scene skipping

## License

MIT

## Support

For issues, feature requests, or questions, please open an issue on the project repository.

