42;
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // File picker
  pickAudioFile: () => ipcRenderer.invoke("pick-audio-file"),
});
