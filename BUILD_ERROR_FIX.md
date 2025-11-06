# Build on Linux - Choose Your Option

## ⚠️ Important: You're Building on Linux

You're currently running on a Linux system, but you tried to build for Mac (`npm run build:mac`).

**Linux can only build for Linux.**
**Mac can only build for Mac.**
**Windows can only build for Windows.**

---

## ✅ Solution: Build for Linux Instead

Since you're on Linux, use this command:

```bash
npm run build:linux
```

This will create a `.AppImage` file that you can:

1. Run on any Linux computer
2. Transfer to another computer running Linux
3. Make executable with: `chmod +x *.AppImage`

---

## 🔄 If You Need Mac or Windows Version

You'll need to:

**For Mac version:**

- Use a Mac computer
- Run: `npm run build:mac`

**For Windows version:**

- Use a Windows computer
- Run: `npm run build:win`

---

## 🚀 Quick Fix - Build for Linux NOW

```bash
npm run build:linux
```

Wait 2-3 minutes, then look in the `release/` folder for your `.AppImage` file!

---

## Questions?

See `SIMPLE_BUILD_GUIDE.md` for more details.
