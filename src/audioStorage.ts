/**
 * IndexedDB-based audio file storage.
 * Audio files are stored as blobs and persist permanently across sessions.
 * Files cannot be deleted through the UI — they are permanent local assets.
 * All files are automatically processed with fade-in/fade-out on upload.
 */

import { processAudioWithFades } from "./audioProcessor";

const DB_NAME = "pn-controller-audio";
const DB_VERSION = 1;
const STORE_NAME = "audioFiles";

// Web-admin remote-storage hooks. Installed by the web admin shell so the
// existing screens can stay synchronous-looking while uploads go to /api/audio.
type WebSaver = (file: File) => Promise<{ id: string; name: string }>;
let webSaver: WebSaver | null = null;
export function setWebAudioSaver(fn: WebSaver | null) { webSaver = fn; }

function looksLikeUrl(id: string): boolean {
  return /^https?:\/\//i.test(id);
}

interface AudioRecord {
  id: string;
  name: string;
  mimeType: string;
  blob: Blob;
  createdAt: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Save an audio file to IndexedDB. Processes with fade-in/out first. Returns the generated ID. */
export async function saveAudioFile(
  file: File,
): Promise<{ id: string; name: string }> {
  if (webSaver) return webSaver(file);

  // Process the audio to bake in fade-in and fade-out
  const processedBlob = await processAudioWithFades(file);

  const db = await openDB();
  const id = `audio_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const record: AudioRecord = {
    id,
    name: file.name,
    mimeType: "audio/wav",
    blob: processedBlob,
    createdAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(record);
    request.onsuccess = () => resolve({ id, name: file.name });
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

/** Get a blob URL for playback. Caller must revoke when done. */
export async function getAudioBlobURL(id: string): Promise<string | null> {
  if (!id) return null;
  if (looksLikeUrl(id)) return id;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => {
      const record = request.result as AudioRecord | undefined;
      if (record) {
        resolve(URL.createObjectURL(record.blob));
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

/** Check if an audio file exists in the store. */
export async function hasAudioFile(id: string): Promise<boolean> {
  if (!id) return false;
  if (looksLikeUrl(id)) return true;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(!!request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}
