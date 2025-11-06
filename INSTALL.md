# Installation and Usage Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run in Development Mode

```bash
npm run dev
```

This will:

- Start the React development server on <http://localhost:5173>
- Launch the Electron app automatically
- Enable hot-reload for development

### 3. Build for Production

**For your current platform:**

```bash
npm run build
```

**For specific platforms:**

```bash
npm run build:win      # Windows (creates .exe installer)
npm run build:mac      # macOS (creates .dmg)
npm run build:linux    # Linux (creates .AppImage)
```

The installers will be in the `release/` folder.

## Installation on Your Computer

After building:

### Windows

1. Navigate to `release/` folder
2. Double-click the `.exe` installer
3. Follow installation wizard
4. Launch from Start Menu

### macOS

1. Navigate to `release/` folder
2. Open the `.dmg` file
3. Drag app to Applications folder
4. Launch from Applications

### Linux

1. Navigate to `release/` folder
2. Make the `.AppImage` executable: `chmod +x *.AppImage`
3. Run the AppImage: `./Pins-Needles-Controller-*.AppImage`

## Using the App Offline

Once installed, the app works **completely offline**:

- No internet connection needed
- All data stored locally on your computer
- Audio files accessed from your local file system

## Data Location

Your show data is stored at:

- **Windows**: `C:\Users\YourName\AppData\Roaming\pins-needles-controller\`
- **macOS**: `~/Library/Application Support/pins-needles-controller/`
- **Linux**: `~/.config/pins-needles-controller/`

## Audio File Tips

1. **Keep audio files in a stable location** - the app stores file paths, not copies
2. **Supported formats**: MP3, WAV, OGG, M4A, AAC
3. **Recommended**: Create a dedicated folder like `~/ShowAudio/` for all your audio files

## Troubleshooting

### Audio not playing

- Check that the audio file still exists at the stored path
- Try re-assigning the audio file
- Check volume slider in Live Controller

### Database errors

- The database file is created automatically on first run
- If corrupted, delete the database file (in data location above) and restart the app

### Build errors

- Make sure you have Node.js 18+ installed: `node --version`
- Delete `node_modules` and `package-lock.json`, then run `npm install` again

## System Requirements

- **OS**: Windows 10+, macOS 10.13+, or modern Linux
- **RAM**: 512 MB minimum
- **Storage**: 100 MB for app + space for audio files
- **Display**: 1024x768 minimum resolution

## Features Overview

### Library Screen

- Manage your comedian database
- Create reusable segment templates
- Search and filter

### Show Builder Screen

- Use default 60-minute template
- Assign comedians to slots
- Adjust durations and order
- Save multiple show configurations

### Live Controller Screen

- Large countdown timer
- Automatic audio playback
- Real-time schedule tracking
- Full schedule overlay for quick navigation

## Support

For issues or questions, check the main README.md file.
