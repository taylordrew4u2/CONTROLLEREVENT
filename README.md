````markdown
# Pins & Needles Show Controller

An app that helps you run live comedy shows. It has a timer, keeps track of your lineup, and tells you if you're running ahead or behind schedule.

Works on phones, tablets, and computers. No account needed — your data stays on your device.

---

## 🚀 Just Want to Use It Right Now?

**Go here:** [https://taylordrew4u2.github.io/CONTROLLEREVENT/](https://taylordrew4u2.github.io/CONTROLLEREVENT/)

That's it. It works in any browser. No download required.

**Want it on your home screen like a real app?**

- **iPhone / iPad:** Open the link in **Safari** → tap the **Share** button (square with arrow) → tap **Add to Home Screen**
- **Android / Fire Tablet:** Open the link in **Chrome** or **Silk Browser** → tap the **three dots** (⋮) menu → tap **Add to Home Screen**
- **Computer (Chrome):** Look for the little install icon in the address bar → click it

Once added, it opens full screen like a regular app. It even works offline after the first visit.

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

## 🖥️ Want It as a Desktop App?

You can download it as a standalone app for **Mac** or **Windows** so it runs outside the browser.

### What You Need First

1. **Node.js** — download it from [https://nodejs.org](https://nodejs.org) (pick the LTS version, install it like any other app)
2. **The code** — download or clone this project to your computer

### Build It

Open **Terminal** (Mac) or **Command Prompt** (Windows) and run these commands one at a time:

```bash
cd CONTROLLEREVENT
npm install
npm run build:mac
```

Replace `build:mac` with `build:win` if you're on Windows.

### Find Your App

After it finishes (takes a couple minutes), look inside the `release` folder:

- **Mac:** You'll see a `.dmg` file — double-click it, drag the app to Applications, done
- **Windows:** You'll see a `.exe` file — double-click it to install, or use the portable version to run it without installing

> 📄 For more detailed desktop build instructions, see [BUILD_ON_MAC.md](BUILD_ON_MAC.md)

---

## 📱 Want It as a Mobile App?

You can build native iOS and Android apps from this same code.

> **This part is for developers.** You'll need Xcode (Mac only, for iOS) or Android Studio (for Android).

```bash
cd CONTROLLEREVENT
npm install
npm run cap:ios       # opens Xcode — build and run from there
npm run cap:android   # opens Android Studio — build and run from there
```

---

## ❓ Something Not Working?

### "I added it to my home screen but it won't open"
- Make sure you used the **https://** link (not http)
- On iPhone, you **must** use Safari — Chrome won't let you add to home screen on iOS

### "My comedians / saved shows are gone"
- Your data is saved in the browser on that specific device
- If you cleared your browser data, it's gone — sorry
- Using Private/Incognito mode? Data doesn't save in private mode
- Switching to a different browser or device? Each one has its own separate data
- **Tip:** Use **Settings → Backup** to save a copy of your data

### "The app doesn't work offline"
- You need to visit the app at least once while connected to the internet
- After that first visit, it caches everything and works offline

### "The timer isn't making any sound"
- Check that your device isn't on silent/mute
- Go to **Settings** in the app and check the volume slider

### "I'm trying to build the desktop app and it's failing"
- Make sure you ran `npm install` first
- Make sure Node.js is installed (type `node --version` in Terminal to check)
- On newer Macs, you might need to run: `brew install python-setuptools`
- See [BUILD_ON_MAC.md](BUILD_ON_MAC.md) for step-by-step help

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

## 🔧 For Developers

<details>
<summary>Click to expand technical details</summary>

### Tech Stack

| What | Technology |
|------|-----------|
| Frontend | React 18 + TypeScript |
| Build | Vite 5 |
| Routing | HashRouter |
| Desktop | Electron 33 + electron-builder |
| Mobile | Capacitor 8 (iOS + Android) |
| Desktop Storage | SQLite (better-sqlite3) |
| Web/Mobile Storage | localStorage |
| PWA | Service worker + web manifest |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |

### Development Commands

```bash
npm run dev           # start local dev server (hot reload)
npm run build         # production build → dist/
npm run preview       # preview the production build locally
npm run electron:dev  # build + launch in Electron
npm run cap:sync      # rebuild + push to native mobile projects
```

### Project Structure

```
├── electron/          # Desktop app wrapper
├── ios/               # iOS project (generated by Capacitor)
├── android/           # Android project (generated by Capacitor)
├── public/            # PWA manifest + service worker
├── src/
│   ├── components/    # Reusable UI (Modal, EmptyState)
│   ├── screens/       # App screens (Library, Builder, Live, Settings)
│   ├── App.tsx        # Root component + navigation
│   ├── storage.ts     # Data persistence layer
│   ├── tokens.css     # Design system (colors, spacing, typography)
│   └── types.ts       # TypeScript type definitions
├── capacitor.config.ts
├── vite.config.ts
└── package.json
```

### Data Storage

- **Web / PWA:** `localStorage` — per-browser, per-device, nothing leaves the device
- **Desktop (Electron):** SQLite database — stored in the OS user data folder
- **Mobile (Capacitor):** `localStorage` — persisted by the native webview

All data stays local. There is no server, no database, no cloud sync.

</details>

---

## License

MIT
````
