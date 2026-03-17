````markdown
# Pins & Needles Show Controller

A touch-friendly PWA for managing and controlling live comedy shows. Built with React, TypeScript, and Vite. Runs on any device with a browser — optimized for Amazon Fire tablets.

**Live app:** [https://taylordrew4u2.github.io/CONTROLLEREVENT/](https://taylordrew4u2.github.io/CONTROLLEREVENT/)

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

### 🎬 Live Show Controller
- **Large Timer Display**: Responsive countdown timer
- **Auto-Advance**: Automatically moves to next segment when time expires
- **Real-Time Adjustments**: +2/-2 minute buttons, skip segment, pause/resume
- **Schedule Status**: Shows if running ahead/behind schedule
- **30-Second Warning**: Visual alert when segment is ending
- **Full Schedule Overlay**: View and jump to any segment during live show
- **Emergency Stop**: Instantly pause timer

### ⚙️ Settings
- Auto-advance and warning preferences
- Volume and fade-out duration
- App info and version

## Using the App

### On an Amazon Fire Tablet (recommended)

1. Open **Silk Browser**
2. Go to **https://taylordrew4u2.github.io/CONTROLLEREVENT/**
3. Tap the **menu** (⋮) → **Add to Home Screen**
4. Name it (e.g., "Show Controller") and tap **Add**
5. Launch from the home screen icon — it opens fullscreen like a native app

### On Any Device

Open **https://taylordrew4u2.github.io/CONTROLLEREVENT/** in any modern browser (Chrome, Safari, Firefox, Edge). Works on phones, tablets, and desktops.

## Quick Start

1. Go to **Library** and add your comedians with default set durations
2. Go to **Builder** — the default 60-minute template loads automatically
3. Tap segments to assign comedians, adjust durations as needed
4. Tap **Save Show** and name it
5. Go to **Live** → **Load Show** → select your show → **Start**

## Data Storage

All data is stored locally in the browser's `localStorage`. Nothing is sent to a server. Data persists across sessions on the same device and browser.

Stored data includes:
- Comedians and their information
- Segment templates
- All saved shows and show templates

## Deployment

The app auto-deploys to GitHub Pages on every push to `main` via GitHub Actions.

### Manual build

```bash
npm install
npm run build     # outputs to dist/
npm run preview   # local preview of production build
```

### GitHub Pages setup (one-time)

1. Go to **Settings → Pages** in the GitHub repo
2. Under **Source**, select **GitHub Actions**
3. Push to `main` — the workflow builds and deploys automatically

## Technical Details

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **Routing**: HashRouter (GitHub Pages compatible)
- **Storage**: localStorage (local-only, no backend)
- **PWA**: Service worker + manifest for offline use and home screen install
- **Hosting**: GitHub Pages (static)
- **CI/CD**: GitHub Actions (auto-deploy on push to `main`)

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

### App not installing to home screen
- Make sure you're visiting the HTTPS URL (not HTTP)
- Use Silk Browser on Fire tablet or Chrome on Android
- On iOS, use Safari → Share → Add to Home Screen

### Data disappeared
- localStorage is per-browser, per-device. Clearing browser data will erase saved shows
- Private/incognito mode does not persist data

### App not loading offline
- Visit the app once while online so the service worker caches the files
- After that, it works offline

## License

MIT

````
