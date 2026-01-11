// Preload script for Electron
// This script runs in a sandboxed environment with access to Node.js APIs

const { contextBridge, ipcRenderer } = require('electron');

// Check online status
const getOnlineStatus = () => navigator.onLine;

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  platform: process.platform,
  isElectron: true,
  
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  
  // Version info
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  },
  
  // Online status
  isOnline: getOnlineStatus,
  
  // Listen for online/offline events
  onOnlineStatusChange: (callback) => {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
  }
});
