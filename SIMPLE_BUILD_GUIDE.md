# BUILD & INSTALL - STEP BY STEP

## 🖥️ What Operating System Do You Have?

### ✅ If You Have WINDOWS

**Copy and paste this command:**

```
npm run build:win
```

**Then:**

1. Wait 2-3 minutes
2. Open the `release` folder
3. Look for a file ending in `.exe`
4. Double-click it to install
5. Done! App is now on your computer

---

### ✅ If You Have MAC

**Copy and paste this command:**

```
npm run build:mac
```

**Then:**

1. Wait 2-3 minutes
2. Open the `release` folder
3. Look for a file ending in `.dmg`
4. Double-click it
5. Drag the app to Applications
6. Done! App is now on your computer

---

### ✅ If You Have LINUX

**Copy and paste this command:**

```
npm run build:linux
```

**Then:**

1. Wait 2-3 minutes
2. Open the `release` folder
3. Look for a file ending in `.AppImage`
4. Right-click it → Properties → Permissions → Make executable
5. Double-click it to run (or install with your package manager)
6. Done! App is now on your computer

---

## 📍 Where's the Release Folder?

It's in the same folder as this file.

**If you're in VS Code:**

- Left sidebar → Look for `release` folder
- If you don't see it yet, run the build command first

**If you're in a file explorer:**

- Navigate to: `/workspaces/CONTROLLEREVENT/release/`

---

## ⏱️ Build Times

First build: **2-3 minutes** (compiles everything)  
Next builds: **1-2 minutes** (faster)

Just wait, don't close anything!

---

## ❌ Something Went Wrong?

### "npm: command not found"

You need Node.js installed. Download from: <https://nodejs.org/>

### Build stopped with errors

Run this first:

```
npm install
```

Then try the build command again.

### Can't find the installer file

Make sure you ran the correct command for your OS:

- Windows: `npm run build:win`
- Mac: `npm run build:mac`
- Linux: `npm run build:linux`

### Still stuck?

Test that everything works first:

```
npm run dev
```

If this opens the app, the build should work.

---

## ✅ Checklist Before Building

- [ ] You have Node.js installed (test: type `node --version`)
- [ ] You're in the right folder (should have `package.json`)
- [ ] You ran `npm install` before (shows success message)
- [ ] You know your operating system (Windows/Mac/Linux)

---

## After Installation

✅ Your app works **100% offline**  
✅ No internet needed  
✅ All your data stays on your computer  
✅ Can use it anytime, anywhere

Enjoy! 🎤
