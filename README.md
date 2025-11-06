# Pins & Needles Show Controller

A desktop application for managing and controlling live comedy shows. Built with Electron, React, and TypeScript for offline use.

## Features

### 📚 Library Management

- **Comedian Database**: Add/edit/delete comedians with custom walk-on audio and default set durations
- **Segment Templates**: Pre-configured show segment types (Host Intro, Opening Act, Transitions, etc.)
- **Searchable Lists**: Quick filtering for easy management

### 🎭 Show Builder

- **Default Template**: Pre-loaded 60-minute show structure
- **Drag & Reorder**: Rearrange segments with automatic timestamp recalculation
- **Assign Comedians/Templates**: Click to assign performers and load their audio
- **Duration Editing**: Adjust segment lengths with real-time timeline updates
- **Save/Load Shows**: Persist complete show configurations
- **Custom Templates**: Save your lineup as the new default template

### 🎬 Live Show Controller

- **Large Timer Display**: Countdown timer with segment time remaining (120pt font)
- **Auto-Advance**: Automatically moves to next segment when time expires
- **Audio Playback**: Plays walk-on/segment audio with preloading for seamless transitions
- **Real-Time Adjustments**: +2/-2 minute buttons, skip segment, pause/resume
- **Schedule Status**: Shows if running ahead/behind schedule
- **30-Second Warning**: Haptic feedback when segment is ending
- **Full Schedule Overlay**: View and jump to any segment during live show
- **Emergency Stop**: Instantly pause timer and audio

## Installation

### Prerequisites

- Node.js 18+ and npm

### Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build installers for distribution
npm run build          # All platforms
npm run build:win      # Windows only
npm run build:mac      # macOS only
npm run build:linux    # Linux only
```

## Building for Distribution

The app uses `electron-builder` to create installers:

- **Windows**: Creates NSIS installer in `release/` folder
- **macOS**: Creates DMG installer in `release/` folder
- **Linux**: Creates AppImage in `release/` folder

After building, you can install the app on your computer and use it completely offline.

## Usage

### First-Time Setup

1. Navigate to **Library** screen
2. Add comedians with their walk-on audio files
3. Optionally customize segment templates
4. Default show template is pre-loaded

### Creating a Show

1. Go to **Show Builder** screen
2. Default 60-minute template loads automatically
3. Click segments to assign specific comedians
4. Adjust durations as needed (timestamps auto-update)
5. Drag segments to reorder
6. Click **Save Show** and name it

### Running a Live Show

1. Go to **Live Controller** screen
2. Click **Load Show** and select your saved show
3. Review the full schedule before starting
4. Click **▶ Start** to begin
5. Timer counts down, audio plays automatically
6. Make real-time adjustments as needed
7. View schedule status (ahead/behind)

## Data Storage

All data is stored locally using SQLite in your user data directory:

- **Windows**: `%APPDATA%/pins-needles-controller/showcontroller.db`
- **macOS**: `~/Library/Application Support/pins-needles-controller/showcontroller.db`
- **Linux**: `~/.config/pins-needles-controller/showcontroller.db`

Audio files are referenced by path, not copied. Keep audio files in a stable location.

## Technical Details

- **Frontend**: React 18 + TypeScript
- **Desktop Framework**: Electron 28
- **Database**: better-sqlite3 (local SQLite)
- **Build Tool**: Vite
- **Audio**: HTML5 Audio API with preloading
- **Styling**: CSS (no framework dependencies)

## Default Show Template

The app comes with a pre-configured 60-minute show structure:

```
0:00-0:05 | Show open + host intro (5 min)
0:05-0:13 | Opening Act 1 (8 min)
0:13-0:14 | Host transition (1 min)
0:14-0:22 | Opening Act 2 (8 min)
0:22-0:23 | Host transition (1 min)
0:23-0:31 | Opening Act 3 (8 min)
0:31-0:42 | Extended host bit (11 min)
0:42-0:43 | Headliner intro (1 min)
0:43-0:58 | Headliner set (15 min)
0:58-1:00 | Show close (2 min)
```

## Support

This is a standalone desktop application that works completely offline. No internet connection required after installation.

## License

MIT
