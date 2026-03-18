````markdown
# Pins & Needles Show Controller

A downloadable app that helps you run live comedy shows. It has a timer, keeps track of your lineup, and tells you if you're running ahead or behind schedule.

Available for **Mac**, **Windows**, **iPhone**, and **Android**. No account needed — your data stays on your device.

---

## 📥 Download & Install

### Mac

1. Go to the [Releases](https://github.com/taylordrew4u2/CONTROLLEREVENT/releases) page
2. Download the `.dmg` file
3. Double-click the `.dmg` file
4. Drag **Pins & Needles Controller** into your **Applications** folder
5. Open it from Applications — done

### Windows

1. Go to the [Releases](https://github.com/taylordrew4u2/CONTROLLEREVENT/releases) page
2. Download the `.exe` file
3. Double-click to install, or use the portable `.exe` to run without installing
4. Launch from your Start Menu or Desktop shortcut

### iPhone / iPad

Coming soon to the App Store. For now, developers can build from source (see [Building from Source](#-building-from-source) below).

### Android

Coming soon to the Google Play Store. For now, developers can build from source (see [Building from Source](#-building-from-source) below).

---

## 📖 How to Use the App

### Step 1: Add Your Comedians

1. Open the app and tap **Library** at the bottom
2. Tap **Add Comedian**
3. Type the comedian's name and how many minutes their set is
4. Tap **Save**
5. Repeat for all your comedians

### Step 2: Build Your Show

1. Tap **Builder** at the bottom
2. A default 60-minute show template is already loaded for you
3. Tap on a segment name to assign a comedian from your library
4. Change the time for any segment by tapping the minutes number
5. Use the arrow buttons to move segments up or down in the order
6. When you're happy with the lineup, tap **Save Show** and give it a name

### Step 3: Run the Show Live

1. Tap **Live** at the bottom
2. Tap **Load Show** and pick the show you saved
3. Tap **Start** — the countdown timer begins
4. The app automatically moves to the next segment when time runs out
5. Use **+2** / **-2** buttons if you need to add or remove time on the fly
6. Use **Skip** to jump to the next segment early
7. Use **Pause** if you need to stop the clock

**During the show, you can see:**
- How much time is left in the current segment (big countdown timer)
- Whether you're ahead or behind schedule (green = ahead, red = behind)
- Who's up next

### Step 4 (Optional): Tweak Settings

Tap **Settings** to change things like:
- Whether the timer auto-advances to the next segment
- Volume for audio cues
- Backup and restore your data

---

## ❓ Something Not Working?

### "My comedians / saved shows are gone"
- Your data is saved on your device — if you uninstalled the app, it may be gone
- **Tip:** Use **Settings → Backup** regularly to save a copy of your data so you can restore it later

### "The timer isn't making any sound"
- Check that your device isn't on silent / mute
- Go to **Settings** in the app and check the volume slider

### "The app won't open on Mac"
- If macOS says the app is from an unidentified developer: right-click the app → **Open** → click **Open** again
- Or go to **System Settings → Privacy & Security** and click **Open Anyway**

### "The app won't open on Windows"
- If Windows SmartScreen blocks it: click **More info** → **Run anyway**

---

## 🎭 Default Show Template

The app comes pre-loaded with this 60-minute show structure. You can customize it however you want:

| Time | Segment | Duration |
|------|---------|----------|
| 0:00 | Show open + host intro | 5 min |
| 0:05 | Opening Act 1 | 8 min |
| 0:13 | Host transition | 1 min |
| 0:14 | Opening Act 2 | 8 min |
| 0:22 | Host transition | 1 min |
| 0:23 | Opening Act 3 | 8 min |
| 0:31 | Extended host bit | 11 min |
| 0:42 | Headliner intro | 1 min |
| 0:43 | Headliner set | 15 min |
| 0:58 | Show close | 2 min |

---

## 🔧 Building from Source

<details>
<summary>Click to expand — for developers only</summary>

### Prerequisites

- **Node.js** — download from [https://nodejs.org](https://nodejs.org) (LTS version)
- **Git** — to clone the repo

### Clone & Install

```bash
git clone https://github.com/taylordrew4u2/CONTROLLEREVENT.git
cd CONTROLLEREVENT
npm install
```

### Build Desktop App

```bash
npm run build:mac   # macOS → release/*.dmg, *.zip
npm run build:win   # Windows → release/*.exe
npm run build:all   # both platforms at once
```

Output goes to the `release/` folder. See [BUILD_ON_MAC.md](BUILD_ON_MAC.md) for detailed instructions.

### Build Mobile App

Requires **Xcode** (Mac only, for iOS) or **Android Studio** (for Android).

```bash
npm run cap:ios       # build + sync + open Xcode
npm run cap:android   # build + sync + open Android Studio
```

Then build and run from the native IDE onto a device or simulator.

### Development Commands

```bash
npm run dev           # start local dev server (hot reload)
npm run build         # production build → dist/
npm run preview       # preview the production build locally
npm run electron:dev  # build + launch in Electron
npm run cap:sync      # rebuild + push to native mobile projects
```

### Tech Stack

| What | Technology |
|------|-----------|
| Frontend | React 18 + TypeScript |
| Build | Vite 5 |
| Routing | HashRouter |
| Desktop | Electron 33 + electron-builder |
| Mobile | Capacitor 8 (iOS + Android) |
| Desktop Storage | SQLite (better-sqlite3) |
| Mobile Storage | localStorage |
| CI/CD | GitHub Actions |

### Project Structure

```
├── electron/          # Desktop app (main process + preload)
├── ios/               # iOS native project
├── android/           # Android native project
├── src/
│   ├── components/    # Reusable UI (Modal, EmptyState)
│   ├── screens/       # Library, ShowBuilder, LiveController, Settings
│   ├── App.tsx        # Root component + navigation
│   ├── storage.ts     # Data persistence layer
│   ├── tokens.css     # Design system (colors, spacing, typography)
│   └── types.ts       # TypeScript type definitions
├── capacitor.config.ts
├── vite.config.ts
└── package.json
```

### Troubleshooting Builds

- **"npm install fails"** — Make sure Node.js is installed (`node --version`)
- **"Mac build fails with Python error"** — Run `brew install python-setuptools`
- **"iOS build fails"** — You need a Mac with Xcode and a signing certificate
- **"Android build fails"** — Make sure Android Studio and SDK are installed

</details>

---

## License

MIT
````
