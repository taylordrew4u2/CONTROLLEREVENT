# BUILD GUIDE - CHOOSE YOUR PLATFORM

Your application is ready to build for any platform! Choose one:

---

## OPTION 1: Building on Windows

**File:** `BUILD_ON_WINDOWS.md`

Quick steps:

```bash
npm install
npm run build:win
```

Result: Windows installer (.exe)

---

## OPTION 2: Building on Mac

**File:** `BUILD_ON_MAC.md`

Quick steps:

```bash
npm install
npm run build:mac
```

Result: Mac application (.dmg or .zip)

---

## OPTION 3: Building on Linux

**File:** `BUILD_ON_LINUX.md`

Quick steps:

```bash
npm install
npm run build:linux
```

Result: Linux application (.AppImage)

---

## IMPORTANT NOTES

- Each platform MUST be built on its own operating system
  - Cannot build Windows app on Mac
  - Cannot build Mac app on Linux
  - Cannot build Linux app on Windows

- All builds are completely offline - no internet required after first npm install

- Builds take 2-3 minutes

---

## Quick Reference

| Platform | File                 | Command              |
|----------|----------------------|----------------------|
| Windows  | BUILD_ON_WINDOWS.md  | npm run build:win    |
| Mac      | BUILD_ON_MAC.md      | npm run build:mac    |
| Linux    | BUILD_ON_LINUX.md    | npm run build:linux  |

---

## Need Help?

1. **First time?** → Read `START_HERE.md`
2. **Want a quick overview?** → Read `SIMPLE_BUILD_GUIDE.md`
3. **Building on Windows?** → Read `BUILD_ON_WINDOWS.md`
4. **Building on Mac?** → Read `BUILD_ON_MAC.md`
5. **Building on Linux?** → Read `BUILD_ON_LINUX.md`

---

**Ready to build? Choose your platform above!**
