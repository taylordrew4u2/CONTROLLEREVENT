````markdown
# Pins & Needles Show Controller

This app runs your live comedy show for you. You put in your lineup, hit Start, and it counts down each comedian's time. It tells you who's up, who's next, and if you're running late.

You download it and install it on your computer — just like any other app.

---

## 📥 How to Get the App

### If you have a Mac:

1. Click here → [**Download for Mac**](https://github.com/taylordrew4u2/CONTROLLEREVENT/releases)
2. Find the file that ends in **`.dmg`** and click it to download
3. When it's done downloading, find the file (probably in your **Downloads** folder) and **double-click** it
4. A window pops up — drag the app icon into the **Applications** folder
5. Open your **Applications** folder and double-click **Pins & Needles Controller** to launch it

**First time opening it?** Mac might say "this app is from an unidentified developer." That's normal. Here's what to do:
- **Right-click** the app (or hold Control and click it)
- Click **Open**
- Click **Open** again when the warning pops up
- It will open normally every time after that

### If you have a Windows PC:

1. Click here → [**Download for Windows**](https://github.com/taylordrew4u2/CONTROLLEREVENT/releases)
2. Find the file that ends in **`.exe`** and click it to download
3. When it's done downloading, find the file and **double-click** it
4. Follow the installer steps — just keep clicking **Next** until it's done
5. The app will be in your **Start Menu** and you might get a **Desktop shortcut** too

**Windows might show a blue popup** saying "Windows protected your PC." That's normal. Here's what to do:
- Click **More info**
- Click **Run anyway**

### If you have an iPhone, iPad, or Android phone:

The mobile version is coming soon. For now, the app works on Mac and Windows computers.

---

## 📖 How to Use the App (Step by Step)

When you open the app, you'll see **four tabs at the bottom**: Library, Builder, Live, and Settings. Here's what each one does:

---

### Step 1: Add your comedians

> You only have to do this once. After you add someone, they're saved.

1. Tap **Library** (bottom of the screen)
2. Tap the **Add Comedian** button
3. Type the comedian's **name**
4. Type how many **minutes** their set is (for example: `8` for an 8-minute set)
5. Tap **Save**
6. Do this for every comedian who might be in your shows

**Want to change someone later?** Just tap their name in the list to edit them. Want to remove someone? Tap the delete button next to their name.

---

### Step 2: Build your show lineup

> This is where you set up the order and timing for tonight's show.

1. Tap **Builder** (bottom of the screen)
2. The app already has a **default 60-minute show template** loaded — you don't have to start from scratch
3. You'll see a list of segments like "Opening Act 1", "Host transition", "Headliner set", etc.
4. **To assign a comedian to a segment:** Tap the segment name → pick a comedian from the dropdown
5. **To change how long a segment is:** Tap the number next to it and type a new number
6. **To rearrange the order:** Use the **up/down arrow buttons** on each segment
7. **To add a new segment:** Tap the **Add Segment** button at the bottom
8. **To remove a segment:** Tap the **delete button** (trash icon) on that segment
9. When the lineup looks right, tap **Save Show** and give it a name (like "Friday Night Show" or "March 17th")

> You can save as many different shows as you want. They'll all be there when you come back.

---

### Step 3: Run the show live

> This is what you use during the actual show. It's basically a big countdown timer that knows your whole lineup.

1. Tap **Live** (bottom of the screen)
2. Tap **Load Show**
3. Pick the show you saved in Step 2
4. Tap **Start**

**Now the timer is running.** Here's what you'll see:

- **Big countdown timer** — shows how much time is left in the current segment
- **Segment name** — shows who's on stage right now
- **Ahead / Behind indicator** — green means you're ahead of schedule, red means you're behind

**Buttons you can use during the show:**

| Button | What it does |
|--------|-------------|
| **+2** | Adds 2 minutes to the current segment (comedian is killing it, give them more time) |
| **-2** | Takes away 2 minutes (running long, need to speed things up) |
| **Skip** | Immediately jumps to the next segment |
| **Pause** | Stops the timer (emergency, technical difficulty, etc.) |

**When a segment's time runs out,** the app automatically starts the next one. You don't have to touch anything — it just keeps going through your lineup.

**Want to see the full schedule?** Tap the schedule button to see every segment, who's assigned, and what time each one starts.

---

### Step 4 (Optional): Settings

Tap **Settings** (bottom of the screen) to change:

- **Auto-advance** — whether the timer automatically moves to the next segment when time's up (on by default — leave it on)
- **Volume** — how loud the audio cues are
- **Backup** — **THIS IS IMPORTANT.** Tap Backup to save a copy of all your comedians and shows. If something ever goes wrong, you can restore from this backup.

---

## ❓ Problems? Read This First

### "I can't find the app after I downloaded it"
- Check your **Downloads** folder
- On Mac: open **Finder** → click **Downloads** on the left
- On Windows: open **File Explorer** → click **Downloads** on the left

### "My comedians are gone" / "My saved shows disappeared"
- Did you delete and reinstall the app? That erases your data.
- **Prevent this from ever happening:** Go to **Settings → Backup** and save a backup. You can restore it later.

### "The timer isn't making any sound"
- Is your computer on **mute**? Check your volume.
- Open the app's **Settings** and make sure the volume slider isn't set to zero.

### "I messed up the show template and want to start over"
- Just make a new show in **Builder** — the default template loads fresh every time
- Your old saved shows are still there under **Load Show**

### "I accidentally closed the app during a show"
- Reopen the app, go to **Live**, and load your show again
- You'll have to restart from the beginning (the timer doesn't save its place if you close the app)

---

## 🎭 What the Default Show Looks Like

The app comes with a pre-made 60-minute show template. You can change any of it:

| Time | What's happening | How long |
|------|-----------------|----------|
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
| | **Total** | **60 min** |

---

## 🔧 For Developers Only

<details>
<summary>Click here if you're a developer and want to build from source code</summary>

### Prerequisites

- [Node.js](https://nodejs.org) (LTS version)
- Git

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

### Development Commands

```bash
npm run dev           # local dev server with hot reload
npm run build         # production build → dist/
npm run preview       # preview production build locally
npm run electron:dev  # build + launch in Electron
npm run cap:sync      # rebuild + sync to native projects
```

### Tech Stack

React 18, TypeScript, Vite 5, Electron 33, Capacitor 8, SQLite (desktop), localStorage (mobile), GitHub Actions CI/CD.

### Troubleshooting Builds

- `npm install` fails → make sure Node.js is installed
- Mac build fails with Python error → `brew install python-setuptools`
- iOS build fails → need Mac + Xcode + signing certificate
- Android build fails → need Android Studio + SDK

</details>

---

## License

MIT
````
