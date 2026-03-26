# Version 2.1.0 Release Notes

## Bug Fixes

- **Fixed show saving on Mac** — Electron was trying to load a dev server URL instead of the built app, causing a blank screen
- **Fixed Save Show / Save Template forms** — wrapped modals in proper `<form>` elements so Enter key submits and required fields are validated
- **Fixed viewport meta** — removed `maximum-scale=1.0` and `user-scalable=no` restrictions

## Improvements

- Accessibility: added form labels, title attributes, and hidden-input classes for file inputs
- CSS: added `-webkit-user-select` prefix for Safari compatibility
- CSS: progress bar now uses CSS custom property instead of inline style
- TypeScript: added `forceConsistentCasingInFileNames` to tsconfig
- Added `vite-env.d.ts` for proper CSS module type declarations

## Technical

- Electron main process now uses `VITE_DEV_SERVER` env var to decide whether to load dev server or built files
- DevTools still open automatically in development when app is not packaged

---

# Version 2.0.0 Release Notes

## Breaking Changes

- App is now **native-only** — it cannot be accessed as a website or PWA
- Removed GitHub Pages deployment
- Opening the app in a plain browser will show a blocked message

## What Changed

- Removed PWA manifest, service worker, and all browser install prompts
- Added native platform guard (Capacitor + Electron detection)
- Removed `requestPersistentStorage()` — not applicable to native platforms
- macOS CI builds fixed with codesign auto-discovery bypass
- Download section now shows separate buttons for Windows (.exe) and macOS (.dmg)
- Confirmation dialogs and toast notifications for comedian and template actions
- Updated dependencies: Vite 8, Electron 41, @vitejs/plugin-react 6

## Supported Platforms

| Platform | Format |
|----------|--------|
| Windows | `.exe` installer |
| macOS | `.dmg` installer |
| Android | `.apk` sideload |

## Installation

Download the installer for your platform from the [Releases page](https://github.com/taylordrew4u2/CONTROLLEREVENT/releases) and follow the instructions in README.md.

---

# Version 1.0.4 Release Notes

## Features

- Audio device selection with test function
- Real-time controller feedback
- Fully offline operation
- macOS native app

## Improvements

- Enhanced audio output control
- Updated documentation for Mac-specific setup

## Installation

Download `Pins & Needles Controller-1.0.4-mac.zip` from the Releases page and follow the Quick Start guide in README.md.
