# Linux BUILD - SIMPLE GUIDE

## Steps to Build on Linux

### 1. Get the Code on Your Linux PC

```bash
# Clone or download the repository to your Linux system
git clone https://github.com/taylordrew4u2/CONTROLLEREVENT.git
cd CONTROLLEREVENT
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build for Linux

```bash
npm run build:linux
```

**Wait 2-3 minutes** while it builds...

### 4. Find Your Application

Look in the `release/` folder for:

- `Pins & Needles Controller-1.0.0.AppImage` (portable app)

### 5. Run the App

```bash
# Make it executable (first time only)
chmod +x "Pins & Needles Controller-1.0.0.AppImage"

# Run it
"Pins & Needles Controller-1.0.0.AppImage"
```

---

## That's It

Your app now works completely offline on your Linux PC! Enjoy!

---

## Troubleshooting

### "npm: command not found"

→ Install Node.js: `sudo apt install nodejs npm`

### Build fails

→ Run: `npm install` again, then try building

### "Permission denied" when running app

→ Run: `chmod +x "Pins & Needles Controller-1.0.0.AppImage"`

### Can't find release folder

→ Make sure build finished without errors
→ Look in the same folder as this file

---

## Need Help?

See `START_HERE.md` or `SIMPLE_BUILD_GUIDE.md` for more details.

---

**Enjoy your Linux app!**
