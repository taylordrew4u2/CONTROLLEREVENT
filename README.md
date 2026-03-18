````markdown
# Pins & Needles Show Controller

A professional show management app for live comedy events. Built with React, TypeScript, and Vite. Runs everywhere — web, desktop (macOS & Windows), and mobile (iOS & Android).

**Live app:** [https://taylordrew4u2.github.io/CONTROLLEREVENT/](https://taylordrew4u2.github.io/CONTROLLEREVENT/)

## Platforms

| Platform | Technology | Install |
|----------|-----------|---------|
| Web / PWA | Vite static build | Visit the live URL, add to home screen |
| macOS | Electron | `npm run build:mac` → `.dmg` / `.zip` in `release/` |
| Windows | Electron | `npm run build:win` → `.exe` installer in `release/` |
| iOS | Capacitor | `npm run cap:ios` → opens Xcode project |
| Android | Capacitor | `npm run cap:android` → opens Android Studio |

## Features

### 📚 Library Management
- **Comedian Database**: Add/edit/delete comedians with default set durations
- **Segment Templates**: Pre-configured show segment types (Host Intro, Opening Act, Transitions, etc.)
- **Searchable Lists**: Quick filtering for easy management

### 🎭 Show Builder
- **Default Template**: Pre-loaded 60-minute show structure
- **Reorder Segments**: Rearrange with automatic timestamp recalculation
- **Assign Comedians/Templates**: Tap to assign performers
- **Duration Editing**: Adjust segment lengths with real-time timeline updates
- **Save/Load Shows**: Persist complete show configurations locally
- **Custom Templates**: Save your lineup as the new default template
- **Segment Notes**: Add per-segment notes for hosts and stage managers

### 🎬 Live Show Controller
- **Large Timer Display**: Responsive countdown timer optimized for low-light environments
- **Auto-Advance**: Automatically moves to next segment when time expires
- **Real-Time Adjustments**: +2/-2 minute buttons, skip segment, pause/resume
- **Schedule Status**: Shows if running ahead/behind schedule with color-coded indicators
- **30-Second Warning**: Visual alert when segment is ending
- **Full Schedule Overlay**: View and jump to any segment during live show
- **Emergency Stop**: Instantly pause timer

### ⚙️ Settings
- Auto-advance and warning preferences
- Audio device selection with volume control
- Backup / restore data
- App info and version

## Quick Start

1. Go to **Library** and add your comedians with default set durations
2. Go to **Builder** — the default 60-minute template loads automatically
3. Tap segments to assign comedians, adjust durations as needed
4. Tap **Save Show** and name it
5. Go to **Live** → **Load Show** → select your show → **Start**

## Installation

### Web / PWA (any device)

Open **https://taylordrew4u2.github.io/CONTROLLEREVENT/** in any modern browser. To install as a PWA:

- **Android / Fire Tablet**: Menu (⋮) → Add to Home Screen
- **iOS**: Safari → Share → Add to Home Screen
- **Desktop**: Chrome address bar install icon

### Desktop App

See [BUILD_ON_MAC.md](BUILD_ON_MAC.md) for detailed step-by-step instructions.

```bash
npm install
npm run build:mac   # macOS → release/*.dmg, *.zip
npm run build:win   # Windows → release/*.exe
npm run build:all   # both platforms
```

### Mobile App

Requires Xcode (iOS) or Android Studio (Android).

```bash
npm install
npm run cap:ios       # build + sync + open Xcode
npm run cap:android   # build + sync + open Android Studio
```

Then build/run from the native IDE onto a device or simulator.

## Development

```bash
npm install
npm run dev           # Vite dev server with HMR
npm run electron:dev  # build + launch Electron
npm run build         # production build → dist/
npm run preview       # preview production build locally
npm run cap:sync      # rebuild + sync to native projects
```

## Data Storage

- **Web / PWA**: `localStorage` — per-browser, per-device, no server
- **Desktop (Electron)**: SQLite via `better-sqlite3` — stored in the app's user data directory
- **Mobile (Capacitor)**: `localStorage` — persisted by the native webview

All data stays on-device. Nothing is sent to a server.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript |
| Build | Vite 5 |
| Routing | HashRouter |
| Desktop | Electron 33 + electron-builder |
| Mobile | Capacitor 8 (iOS + Android) |
| Desktop Storage | better-sqlite3 |
| Web/Mobile Storage | localStorage |
| PWA | Service worker + web manifest |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |

## Default Show Template

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

### PWA not installing to home screen
- Make sure you're visiting the HTTPS URL
- Use Silk Browser on Fire tablet, Chrome on Android, or Safari on iOS

### Data disappeared
- `localStorage` is per-browser, per-device — clearing browser data erases saved shows
- Private/incognito mode does not persist data

### App not loading offline
- Visit the app once while online so the service worker caches files
- After that, it works offline

### Desktop build fails
- Run `npm install` first — Electron and electron-builder must be installed
- On macOS with Python 3.14+, you may need: `brew install python-setuptools`
- See [BUILD_ON_MAC.md](BUILD_ON_MAC.md) for platform-specific instructions

### Mobile build fails
- Ensure Xcode (iOS) or Android Studio (Android) is installed
- Run `npm run cap:sync` before opening the native project
- iOS requires a Mac with Xcode and a valid signing certificate for device builds

## Project Structure

```
├── electron/          # Electron main + preload
├── ios/               # Capacitor iOS project (Xcode)
├── android/           # Capacitor Android project
├── public/            # PWA manifest + service worker
├── src/
│   ├── components/    # Modal, EmptyState
│   ├── screens/       # Library, ShowBuilder, LiveController, Settings
│   ├── App.tsx        # Root component + navigation
│   ├── storage.ts     # localStorage abstraction
│   ├── tokens.css     # Design system tokens
│   └── types.ts       # TypeScript types
├── capacitor.config.ts
├── vite.config.ts
└── package.json
```

## License

MIT
````
