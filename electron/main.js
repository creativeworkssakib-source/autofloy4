const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    icon: path.join(__dirname, '../public/favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    title: 'Autofloy Offline Shop',
    show: false
  });

  // Load the Offline Shop URL directly
  win.loadURL('https://d767a1d5-e35f-4b16-bc56-67e62e146598.lovableproject.com/offline-shop');

  // Remove menu bar for cleaner look
  win.setMenuBarVisibility(false);

  // Set window title
  win.setTitle('Autofloy Offline Shop');

  // Show window when ready
  win.once('ready-to-show', () => {
    win.show();
  });

  // Handle window closed
  win.on('closed', () => {
    app.quit();
  });
}

// Set app name
app.name = 'Autofloy Offline Shop';

// Create window when app is ready
app.whenReady().then(createWindow);

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Re-create window on macOS when dock icon is clicked
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
