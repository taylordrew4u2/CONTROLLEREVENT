# 🍎 BUILD ON MAC - SIMPLE GUIDE

## Steps to Build on Mac

### 1. Get the Code on Your Mac

```bash
# Clone or download the repository to your Mac
git clone https://github.com/taylordrew4u2/CONTROLLEREVENT.git
cd CONTROLLEREVENT
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build for Mac

```bash
npm run build:mac
```

**Wait 2-3 minutes** while it builds...

### 4. Find Your App

Look in the `release/` folder for:

- `Pins & Needles Controller.dmg` (installer)
- `Pins & Needles Controller.zip` (portable version)

### 5. Install & Use

**Option A - DMG Installer:**

1. Double-click the `.dmg` file
2. Drag app to Applications
3. Launch from Applications

**Option B - ZIP File:**

1. Double-click the `.zip` file
2. Move the app to Applications
3. Launch from Applications

---

## That's It

Your app now works completely offline on your Mac! 🎉

---

## Troubleshooting

### "npm: command not found"

→ Install Node.js from <https://nodejs.org/>

### Build fails

→ Run: `npm install` again, then try building

### Can't find release folder

→ Make sure build finished without errors
→ Look in the same folder as this file

### Permission denied

→ Run: `chmod +x *.dmg` in the release folder

---

## Need Help?

See `START_HERE.md` or `SIMPLE_BUILD_GUIDE.md` for more details.

---

**Enjoy your Mac app! 🎤**
