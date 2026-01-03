const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectInputFile: () => ipcRenderer.invoke('select-input-file'),
  selectOutputFolder: () => ipcRenderer.invoke('select-output-folder'),
  getProfiles: () => ipcRenderer.invoke('get-profiles'),
  sanitize: (options) => ipcRenderer.invoke('sanitize', options),
  onSanitizeProgress: (callback) => {
    ipcRenderer.on('sanitize-progress', (event, data) => callback(data));
  },
});

