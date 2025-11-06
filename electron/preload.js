42
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Comedians
  getComedians: () => ipcRenderer.invoke('get-comedians'),
  addComedian: (comedian) => ipcRenderer.invoke('add-comedian', comedian),
  updateComedian: (id, comedian) => ipcRenderer.invoke('update-comedian', id, comedian),
  deleteComedian: (id) => ipcRenderer.invoke('delete-comedian', id),
  
  // Templates
  getTemplates: () => ipcRenderer.invoke('get-templates'),
  addTemplate: (template) => ipcRenderer.invoke('add-template', template),
  updateTemplate: (id, template) => ipcRenderer.invoke('update-template', id, template),
  deleteTemplate: (id) => ipcRenderer.invoke('delete-template', id),
  
  // Show Templates
  getDefaultShowTemplate: () => ipcRenderer.invoke('get-default-show-template'),
  saveShowTemplate: (name, segments) => ipcRenderer.invoke('save-show-template', name, segments),
  
  // Shows
  getShows: () => ipcRenderer.invoke('get-shows'),
  getShow: (id) => ipcRenderer.invoke('get-show', id),
  saveShow: (show) => ipcRenderer.invoke('save-show', show),
  updateShow: (id, show) => ipcRenderer.invoke('update-show', id, show),
  deleteShow: (id) => ipcRenderer.invoke('delete-show', id),
  
  // File picker
  pickAudioFile: () => ipcRenderer.invoke('pick-audio-file'),
});
