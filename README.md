````markdown
# Pins & Needles Show Controller

A professional desktop application for managing and controlling live comedy shows on macOS. Built with Electron, React, and TypeScript for 100% offline use.

## Features

### � Audio Output Control
- **Audio Device Selection**: Switch between speakers, headphones, AirPods, and other connected audio devices
- **Master Volume Control**: Precise volume adjustment (0-100%)
- **Test Audio**: Verify your selected audio output before the show
- **Fade-Out Effects**: Smooth audio transitions between segments (0.5-5 seconds configurable)

### �📚 Library Management
- **Comedian Database**: Add/edit/delete comedians with custom walk-on audio and default set durations
- **Segment Templates**: Pre-configured show segment types (Host Intro, Opening Act, Transitions, etc.)
- **Searchable Lists**: Quick filtering for easy management

### 🎭 Show Builder
- **Default Template**: Pre-loaded 60-minute show structure
- **Reorder Segments**: Rearrange with automatic timestamp recalculation
- **Assign Comedians/Templates**: Click to assign performers and load their audio
- **Duration Editing**: Adjust segment lengths with real-time timeline updates
- **Save/Load Shows**: Persist complete show configurations to local database
- **Custom Templates**: Save your lineup as the new default template

### 🎬 Live Show Controller
- **Large Timer Display**: Countdown timer with 120pt font
- **Auto-Advance**: Automatically moves to next segment when time expires
- **Audio Playback**: Plays audio from your selected device with seamless transitions
- **Real-Time Adjustments**: +2/-2 minute buttons, skip segment, pause/resume
- **Schedule Status**: Shows if running ahead/behind schedule
- **30-Second Warning**: Haptic feedback when segment is ending
- **Full Schedule Overlay**: View and jump to any segment during live show
- **Emergency Stop**: Instantly pause timer and audio

### ⚙️ Settings
- Master volume and fade-out duration
- Auto-advance and warning preferences
- Audio device selection with test function
- Version and app information

## Installation

### Download
1. Go to [Releases](https://github.com/taylordrew4u2/CONTROLLEREVENT/releases)
2. Download `Pins & Needles Controller-1.0.0-mac.zip`
3. Extract the ZIP file
4. Double-click the app or drag to Applications folder
5. Right-click → Open to bypass security warning first time

### Running from Applications
1. Open Applications folder
2. Double-click "Pins & Needles Controller"
3. The app launches fully offline

## Usage

### First-Time Setup

1. Navigate to **Library** screen
2. Add comedians with their walk-on audio files
3. Optionally customize segment templates
4. Default 60-minute show template is pre-loaded

### Creating a Show

1. Go to **Show Builder** screen
2. Default template loads automatically
3. Click segments to assign specific comedians
4. Adjust durations as needed (timestamps auto-update)
5. Reorder segments as needed
6. Click **Save Show** and name it

### Configuring Audio

1. Go to **Settings** screen
2. Select your audio output device (speakers, headphones, AirPods, etc.)
3. Adjust master volume
4. Click **Test Audio** to verify output
5. Adjust fade-out duration (default 2 seconds)

### Running a Live Show

1. Go to **Live Controller** screen
2. Click **Load Show** and select your saved show
3. Review the full schedule before starting
4. Click **▶ Start** to begin
5. Timer counts down, audio plays automatically
6. Make real-time adjustments as needed
7. View schedule status (ahead/behind)

## Data Storage

All data is stored locally in your macOS user data directory:

```
~/Library/Application Support/pins-needles-controller/showcontroller.db
```

This SQLite database stores:
- Comedians and their information
- Segment templates
- All saved shows
- Show settings

**Audio files** are referenced by path, not copied. Keep audio files in a stable location.

## Technical Details

- **Frontend**: React 18 + TypeScript
- **Desktop Framework**: Electron 28
- **Database**: better-sqlite3 (local SQLite)
- **Build Tool**: Vite
- **Audio**: HTML5 Audio API with device selection
- **Styling**: CSS Grid/Flexbox (responsive design)
- **Platform**: macOS 10.13+

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

## Troubleshooting

### "Cannot verify" error on first launch
This is normal for unsigned apps on macOS. Solution:
1. Right-click the app
2. Select **Open**
3. Click **Open** in the dialog
4. macOS will remember and open it normally next time

### Audio not playing
1. Go to **Settings** screen
2. Click **Test Audio** to verify your device is working
3. Make sure audio files are accessible (not on external drives that are disconnected)
4. Check volume in Settings isn't at 0%

### Shows not saving
All save operations are logged to browser console (Cmd+Option+I if needed). Check:
1. You entered a show name before saving
2. Segments have durations set
3. There's space on your disk

## Support

This is a standalone desktop application that works completely offline. No internet connection required after installation.

For issues or feature requests, visit the [GitHub repository](https://github.com/taylordrew4u2/CONTROLLEREVENT).

## License

MIT

````
