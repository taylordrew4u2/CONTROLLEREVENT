# 🪟 BUILD ON WINDOWS - SIMPLE GUIDE

## Steps to Build on Windows

### 1. Get the Code on Your Windows PC

```bash
# Clone or download the repository to your PC
git clone https://github.com/taylordrew4u2/CONTROLLEREVENT.git
cd CONTROLLEREVENT
```

### 2. Install Dependencies

Open PowerShell or Command Prompt and run:

```bash
npm install
```

### 3. Build for Windows

```bash
npm run build:win
```

**Wait 2-3 minutes** while it builds...

### 4. Find Your Installer

Look in the `release/` folder for:

- `Pins & Needles Controller Setup 1.0.0.exe` (installer)

### 5. Install & Use

1. Double-click the `.exe` file
2. Follow the installation wizard
3. Launch from Start Menu

---

## That's It

Your app now works completely offline on your Windows PC! 🎉

---

## Troubleshooting

### "npm: command not found"

→ Install Node.js from <https://nodejs.org/>

### Build fails

→ Run: `npm install` again in PowerShell, then try building

### Can't find release folder

→ Make sure build finished without errors
→ Look in the same folder as this file

### Windows Defender Warning

→ This is normal for new apps
→ Click "Run anyway" to proceed

---

## Need Help?

See `START_HERE.md` or `SIMPLE_BUILD_GUIDE.md` for more details.

---

**Enjoy your Windows app! 🎤**
