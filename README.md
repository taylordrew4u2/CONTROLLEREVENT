# Pins & Needles Show Controller

A live show audio controller and run-of-show manager. Built for comedy shows, variety shows, and any live event where a stage manager needs to play the right song for the right performer and keep the show on schedule.

**Runs on Mac, Windows, and Android.** The core controller is a native app.  
**Optional:** This repo can also be deployed to **Vercel** as a lightweight **web viewer** (audience-facing) plus a password-protected **/admin** page to control “Now / Next Up” and the countdown timer in near real time.

---

## 🌐 Web Viewer (Vercel)

If you want a public page where anyone can watch the event timer + “Next Up” list in real time:

- Viewer: `/` (public)
- Admin: `/admin` (requires password; default is `weed69` unless you set `ADMIN_PASSWORD`)

### What It Does

- Admin types **Now** + **Next Up**, then starts/stops a countdown timer.
- Everyone on the viewer page updates automatically (polls once per second).

### Manual Vercel Setup (After Code Is Deployed)

1. **Create a Vercel project** from this repo.
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
2. **Provision storage (required):**
   - Recommended: enable **Vercel KV** (it’s Upstash Redis under the hood).
   - Vercel will add these env vars automatically:
     - `UPSTASH_REDIS_REST_URL`
     - `UPSTASH_REDIS_REST_TOKEN`
3. **Set the admin password env var:**
   - In Vercel → Project → Settings → Environment Variables
   - Add `ADMIN_PASSWORD` = `weed69` (or change it to something stronger).
4. **Deploy.**
5. Share the viewer URL (`https://<your-app>.vercel.app/`) with your audience.
6. As the admin, open `https://<your-app>.vercel.app/admin`, enter the password, then:
   - Update **Now** / **Next Up**
   - Click **Start / Restart Timer**

### Notes / Security

- The `/admin` page is “password protected” by checking `ADMIN_PASSWORD` on the serverless API. Anyone with the password can control the show state.
- The default password fallback is `weed69` if you forget to set `ADMIN_PASSWORD` on Vercel.

### Local Testing (Optional)

The web UI calls `/api/state`, which is a Vercel Serverless Function. For local testing of the web viewer/admin with the API:

- Install the Vercel CLI and run `vercel dev`
- Or deploy to Vercel first and test against the deployed URL

---

## What This App Does (Plain English)

You tell the app who's performing tonight and in what order. You give each performer walk-on and walk-off music. Then you hit Start and the app:

1. **Counts down each performer's time** so you always know how much time is left
2. **Plays the right walk-on music** when each performer takes the stage
3. **Plays walk-off music** when they leave
4. **Shows you if you're ahead or behind schedule** so you can adjust on the fly
5. **Auto-advances to the next performer** when time runs out (you can also skip manually)

You don't have to remember anything. The app handles it.

---

## 📥 How to Get the App

Go to [**github.com/taylordrew4u2/CONTROLLEREVENT/releases**](https://github.com/taylordrew4u2/CONTROLLEREVENT/releases) and download the file for your device.

### Mac

1. Download the file that ends in **`.dmg`**
2. Open it → drag the app to **Applications**
3. First time opening: **right-click the app → Open → Open** (Mac blocks unverified apps the first time — this is normal and only happens once)

### Windows

1. Download the file that ends in **`.exe`**
2. Run it → click **Next** through the installer
3. If Windows shows a blue "protected your PC" popup → click **More info** → **Run anyway**

### Android

1. Download the file that ends in **`.apk`**
2. Tap the downloaded file → tap **Install**
3. If your phone says "Install unknown apps" is not allowed → it will show you the setting to turn it on → turn it on → go back and tap the file again
4. Can't find the download? Pull down your notifications or open **Files → Downloads**

### iPhone / iPad

Coming soon.

---

## 📖 How to Use the App

The app has **four tabs** along the bottom: **Library**, **Builder**, **Live**, and **Settings**.

You only need to do Steps 1 and 2 once per show. Step 3 is what you use during the actual show.

---

### Step 1: Add Your Performers (Library tab)

> You only do this once per person. After you save a performer, they're in the app forever (until you delete them).

1. Tap **Library**
2. Tap **Add Performer**
3. Type their **name**
4. Type their **default set length** in minutes (example: `8` for 8 minutes)
5. **(Optional but recommended)** Tap **Choose File** under Walk-On Music → pick an audio file from your device
6. **(Optional)** Tap **Choose File** under Walk-Off Music → pick an audio file
7. Tap **Save**

Repeat for every performer who might appear in your shows.

**Good to know:**
- Audio files are automatically processed with smooth **fade-in and fade-out** so transitions don't sound abrupt
- You can edit or delete any performer later by tapping them in the list
- The search bar at the top filters the list as you type

---

### Step 2: Build Your Show Lineup (Builder tab)

> This is where you set up tonight's show — who's performing, in what order, for how long.

1. Tap **Builder**
2. Tap **Add from Library** to add performers from your library
   - Each performer's name, set time, and audio files are copied into the lineup automatically
3. Or tap **Add Custom** to add a non-library entry (like "Intermission" or "Host Intro")

**For each performer in the lineup, you can:**

| Action | How |
| ------ | --- |
| **Change their name** | Tap their name in the lineup to edit it |
| **Change their time** | Change the number in the minutes field |
| **Move them up/down** | Tap the **↑** or **↓** arrows |
| **Add notes** | Tap the **N** button (for credits, reminders, etc.) |
| **Set walk-on audio** | Tap the **♪** button to pick an audio file for this specific slot |
| **Remove them** | Tap the **✕** button |

4. When the lineup looks right, tap **Save Show** → give it a name (like "Friday Night" or "March 22")
5. To edit a previously saved show, tap **Load** → pick the show → make changes → **Save Show** again

**Key concept:** Audio assignments travel with each performer. If you rearrange the lineup, the right walk-on and walk-off music stays attached to the right person. You never have to re-assign audio after reordering.

---

### Step 3: Run the Show Live (Live tab)

> This is the main event. Open this tab when the show is about to start.

1. Tap **Live**
2. Tap **Load Show** → pick the show you saved in Step 2
3. Tap **Start**

**What you'll see:**

- **Big countdown timer** — how much time the current performer has left
- **Performer name and time slot** — who's on stage right now
- **Schedule status** — "On Time", "+2:30" (behind), or "-1:00" (ahead)
- **Next Up** — who's coming after the current performer
- **Now Playing indicator** — shows when walk-on or walk-off music is playing

**Buttons during the show:**

| Button | What it does |
| ------ | ------------ |
| **Start / Pause** | Start or pause the countdown timer |
| **+2 Min** | Give the current performer 2 extra minutes |
| **−2 Min** | Take away 2 minutes (running long, need to catch up) |
| **Next** | Skip to the next performer immediately |
| **Walk-On** | Play the current performer's walk-on music |
| **Walk-Off** | Play the current performer's walk-off music |
| **Play / Pause** | Pause or resume the current audio track |
| **Stop Audio** | Stop all audio immediately |
| **Restart** | Restart the current audio track from the beginning |
| **Mute / Unmute** | Mute all audio without stopping it |
| **Vol slider** | Adjust volume in 5% steps |
| **Lineup** | See the full show schedule — tap any performer to jump to them |
| **Stop** | Emergency stop — stops timer and fades out all audio |
| **Switch Show** | Load a different show |

**How auto-advance works:** When a performer's time runs out, the app automatically moves to the next performer and plays their walk-on music. Your phone will vibrate 30 seconds before time expires as a heads-up. You can turn auto-advance off in Settings.

---

### Step 4: Settings (optional)

Tap **Settings** to configure:

| Setting | What it does | Default |
| ------- | ------------ | ------- |
| **Master Volume** | Overall audio volume | 80% |
| **Fade-Out Duration** | How long audio fades during transitions | 2 seconds |
| **Audio Fade-In** | Fade-in baked into uploaded audio files | 2 seconds |
| **Audio Fade-Out** | Fade-out baked into uploaded audio files | 3 seconds |
| **Audio Output** | Which speaker/device to play audio through | System Default |
| **Auto-advance** | Auto-move to next performer when time expires | On |
| **30-second warnings** | Vibrate when 30 seconds remain | On |

**IMPORTANT — Back up your data:**
- Tap **Export Data** to save a backup file of all your performers and shows
- Tap **Import Data** to restore from a backup
- **Do this regularly.** If you delete the app or clear your data, everything is gone unless you have a backup.

---

## ❓ Common Problems

### "My performers / shows are gone"
Did you reinstall the app or clear app data? That erases everything. Restore from a backup (Settings → Import Data). **If you don't have a backup, the data is gone.** Prevent this by exporting a backup regularly.

### "No sound is playing"
1. Check that your device isn't muted
2. Check the volume slider in the app (Settings → Master Volume)
3. Check the volume slider on the Live screen
4. Make sure you actually uploaded audio files for the performer (Library → Edit → Walk-On Music)

### "I want to start over with a fresh lineup"
Tap **Builder** → **Reset** → confirm. This clears the current lineup. Your saved shows and performers in the Library are not affected.

### "I closed the app during a live show"
Reopen the app → go to **Live** → **Load Show** → pick the show. You'll have to restart from the beginning — **the timer does not save its position if the app closes.**

### "I want to change walk-on music for just one show"
In the **Builder**, tap the **♪** button on that performer's row to set audio for that specific show slot. This overrides the default from the Library without changing the Library entry.

### "The walk-on music doesn't have a smooth fade"
Fade-in/out is baked into the audio when you upload it. If you changed the fade settings after uploading, you need to re-upload the audio file for the new settings to take effect.

---

## 🔧 For Developers

<details>
<summary>Click to expand build instructions</summary>

### Prerequisites

- [Node.js](https://nodejs.org) (LTS)
- Git

### Setup

```bash
git clone https://github.com/taylordrew4u2/CONTROLLEREVENT.git
cd CONTROLLEREVENT
npm install
```

### Build Commands

```bash
npm run dev           # local dev server with hot reload
npm run build         # production build → dist/
npm run electron:dev  # build + launch in Electron
npm run build:mac     # macOS → release/*.dmg, *.zip
npm run build:win     # Windows → release/*.exe
npm run build:all     # Mac + Windows
npm run cap:sync      # rebuild + sync to mobile projects
npm run cap:ios       # build + sync + open Xcode
npm run cap:android   # build + sync + open Android Studio
npm run build:android # build release APK
```

### Tech Stack

React 18 · TypeScript 5 · Vite 8 · Electron 41 · Capacitor 8 · localStorage (data) · IndexedDB (audio blobs)

### Build Troubleshooting

| Problem | Fix |
| ------- | --- |
| `npm install` fails | Make sure Node.js is installed |
| Mac build Python error | `brew install python-setuptools` |
| iOS build fails | Need Mac + Xcode + signing certificate |
| Android build fails | Need JDK 21 (`brew install --cask temurin@21`) + Android SDK |

See [BUILD_ON_MAC.md](BUILD_ON_MAC.md) for detailed Mac build instructions.

</details>

---

## License

MIT
