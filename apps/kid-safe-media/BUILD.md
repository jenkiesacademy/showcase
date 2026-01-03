# Build Instructions

## Prerequisites

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **FFmpeg** - Must be installed and in PATH
   - Windows: Download from [ffmpeg.org](https://ffmpeg.org/download.html)
   - Mac: `brew install ffmpeg`
   - Linux: `sudo apt-get install ffmpeg`

## Development Setup

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run CLI
npm start -- -i "path/to/video.mkv" -p toddler -o "path/to/output"

# Run Electron GUI (development)
npm run electron:dev
```

## Building Executables

### Windows Executable (.exe)

```bash
npm run electron:build:win
```

Output: `release/Kid Safe Media Sanitizer Setup.exe`

### Mac DMG

```bash
npm run electron:build:mac
```

Output: `release/Kid Safe Media Sanitizer.dmg`

### CLI-only Executables (using pkg)

```bash
# Windows
npm run package:win

# Mac
npm run package:mac
```

## Notes

- First build will download the Whisper model (~75MB)
- Electron builds include all dependencies
- Icons are optional (app will work without them)
- FFmpeg must be available on the target system

