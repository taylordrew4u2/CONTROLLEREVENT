# 🎭 QUICK START GUIDE

## Get Up and Running in 3 Steps

### Step 1: Install Dependencies

```bash
npm install
```

*(Already done if you see this file!)*

---

### Step 2: Run the App

```bash
npm run dev
```

This opens the app in development mode. Try it out:

1. Go to **Library** → Add a test comedian
2. Go to **Show Builder** → See the default template
3. Go to **Live Controller** → Load a show (once you've saved one)

---

### Step 3: Build for Your Computer

```bash
# On Linux/Mac, use the helper script:
./build.sh

# Or manually:
npm run build:win      # For Windows
npm run build:mac      # For macOS  
npm run build:linux    # For Linux
```

The installer will be in the `release/` folder. Install it and run offline!

---

## What This App Does

**Library Management**

- Store comedians with their walk-on music
- Create reusable segment templates

**Show Builder**  

- Build your lineup from a 60-minute default template
- Assign comedians to time slots
- Adjust durations and order
- Save complete show configurations

**Live Controller**

- Run your show with a big countdown timer
- Auto-play audio for each segment
- Track if you're running ahead or behind schedule
- Make real-time adjustments

---

## Everything Works Offline

Once you install the app on your computer:

- ✅ No internet needed
- ✅ All data stored locally
- ✅ Audio files from your computer
- ✅ Private and secure

---

## File Structure

```
📁 electron/          ← Backend (database, file picker)
📁 src/
  📁 screens/         ← Three main screens
  📄 App.tsx          ← Main app
  📄 types.ts         ← Data types
📄 package.json       ← Dependencies
📄 README.md          ← Full docs
📄 PROJECT_SUMMARY.md ← Technical details
```

---

## Next Steps

1. **Try it**: `npm run dev`
2. **Build it**: `./build.sh` (or `npm run build:win`)
3. **Install it**: Open file in `release/` folder
4. **Use it**: Run completely offline on your computer!

---

## Need Help?

- **Full documentation**: See `README.md`
- **Installation guide**: See `INSTALL.md`
- **Technical details**: See `PROJECT_SUMMARY.md`

---

**That's it! You're ready to manage live comedy shows offline. 🎤**
