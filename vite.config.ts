import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Native builds (Electron/Capacitor) need relative asset paths.
  // Vercel/web builds need absolute paths so deep links like /admin work.
  base: process.env.VERCEL ? "/" : "./",
  build: {
    outDir: "dist",
  },
  server: {
    port: 5173,
  },
});
