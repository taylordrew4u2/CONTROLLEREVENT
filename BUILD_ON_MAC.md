# 🖥️ BUILD DESKTOP APP - SIMPLE GUIDE

## Build on Mac (creates macOS app)

### 1. Get the Code

```bash
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

## Build on Windows (creates Windows app)

### 1. Get the Code

```bash
git clone https://github.com/taylordrew4u2/CONTROLLEREVENT.git
cd CONTROLLEREVENT
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build for Windows

```bash
npm run build:win
```

**Wait 2-3 minutes** while it builds...

### 4. Find Your App

Look in the `release/` folder for:

- `Pins & Needles Controller Setup.exe` (installer)
- `Pins & Needles Controller.exe` (portable, no install needed)

### 5. Install & Use

**Option A - Installer (.exe Setup):**

1. Double-click the Setup `.exe` file
2. Follow the install wizard
3. Launch from Start Menu or Desktop shortcut

**Option B - Portable (.exe):**

1. Just double-click and run — no installation needed

---

## Build for Both at Once

If you're on a Mac and want to build for both platforms:

```bash
npm run build:all
```

> **Note:** Cross-compiling Windows from Mac works for most cases. For best results, build Windows on a Windows machine.

---

## Troubleshooting

### "npm: command not found"

→ Install Node.js from <https://nodejs.org/>

### Build fails

→ Run: `npm install` again, then try building

### Can't find release folder

→ Make sure build finished without errors
→ Look in the same folder as this file

### Permission denied (Mac)

→ Run: `chmod +x *.dmg` in the release folder

### Windows SmartScreen warning

→ Click "More info" → "Run anyway" (the app is not signed with a certificate)

---

## Need Help?

See `README.md` for more details.

---

**Enjoy your Mac app! 🎤**
