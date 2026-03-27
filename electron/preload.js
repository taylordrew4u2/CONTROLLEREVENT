42;
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {});
