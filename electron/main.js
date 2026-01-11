const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

// For production, use local files. For dev, use URL
const isDev = process.env.NODE_ENV === 'development';
const PRODUCTION_URL = `file://${path.join(__dirname, '../dist/index.html')}`;
const DEV_URL = 'https://e5d6a0c5-59f3-4540-831c-26b5a8ab5ed7.lovableproject.com';

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
      webSecurity: true,
    },
    titleBarStyle: 'default',
    show: false,
    autoHideMenuBar: true,
  });

  // Load URL based on environment
  // For offline support, production should use local files
  if (isDev) {
    win.loadURL(DEV_URL);
  } else {
    // Try loading local files first for offline support
    win.loadFile(path.join(__dirname, '../dist/index.html')).catch(() => {
      // Fallback to remote URL if local files not found
      win.loadURL(DEV_URL);
    });
  }

  // Create simple menu
  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Learn More',
          click: () => shell.openExternal('https://autofloy.com')
        }
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);

  // Show window when ready
  win.once('ready-to-show', () => {
    win.show();
  });

  // Handle external links
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle window closed
  win.on('closed', () => {
    app.quit();
  });
}

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
