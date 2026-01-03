# Quick Start Guide

## Installation

1. **Install FFmpeg** (required)
   - Mac: `brew install ffmpeg`
   - Windows: Download from [ffmpeg.org](https://ffmpeg.org/download.html)
   - Linux: `sudo apt-get install ffmpeg`

2. **Install dependencies**
   ```bash
   cd kid-safe-media
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

## Usage

### Option 1: GUI (Recommended)

```bash
npm run electron:dev
```

Then:
1. Click "Browse" to select your video file
2. Click "Browse" to select output folder (Plex media location)
3. Select a profile (Toddler or PG)
4. Click "Start Sanitization"

### Option 2: Command Line

```bash
npm start -- -i "/path/to/Movie.mkv" -p toddler -o "/path/to/output"
```

## Building Executables

### Windows
```bash
npm run electron:build:win
```
Output: `release/Kid Safe Media Sanitizer Setup.exe`

### Mac
```bash
npm run electron:build:mac
```
Output: `release/Kid Safe Media Sanitizer.dmg`

## First Run Notes

- First transcription will download the Whisper model (~75MB)
- Processing time: ~1-2x video duration
- Output files are Plex-compatible and automatically recognized

## Troubleshooting

**"FFmpeg not found"**
- Ensure FFmpeg is installed and in your PATH
- Test with: `ffmpeg -version`

**Slow processing**
- Normal for first run (model download)
- Transcription speed depends on CPU and video length

**No profanity detected**
- Check profile settings
- Verify words are in the profile's mute list
- Lower `min_confidence` in profile if needed

