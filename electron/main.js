const { app, BrowserWindow, Menu, shell, session } = require('electron');
const path = require('path');
const fs = require('fs');

// For production, use local files. For dev, use URL
const isDev = process.env.NODE_ENV === 'development';
const DEV_URL = 'https://e5d6a0c5-59f3-4540-831c-26b5a8ab5ed7.lovableproject.com';

// Get the local dist path
function getLocalDistPath() {
  const distPath = path.join(__dirname, '../dist/index.html');
  return fs.existsSync(distPath) ? distPath : null;
}

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
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'default',
    show: false,
    autoHideMenuBar: true,
  });

  // Check if we have local files
  const localPath = getLocalDistPath();
  
  // Load URL based on environment and availability
  if (isDev) {
    win.loadURL(DEV_URL);
  } else if (localPath) {
    // Production with local files - works offline
    win.loadFile(localPath);
  } else {
    // No local files, try remote
    win.loadURL(DEV_URL);
  }

  // Handle load failures (offline mode)
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.log('Load failed:', errorDescription);
    
    // If remote load failed, try local
    if (localPath && !isDev) {
      win.loadFile(localPath);
    } else {
      // Show offline page
      win.loadURL(`data:text/html;charset=utf-8,
        <html>
          <head>
            <style>
              body { 
                font-family: system-ui; 
                display: flex; 
                flex-direction: column;
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                margin: 0; 
                background: #0f172a; 
                color: white; 
              }
              h1 { font-size: 24px; margin-bottom: 16px; }
              p { color: #94a3b8; margin-bottom: 24px; }
              button { 
                padding: 12px 24px; 
                background: #6366f1; 
                border: none; 
                border-radius: 8px; 
                color: white; 
                font-size: 16px; 
                cursor: pointer; 
              }
              button:hover { background: #4f46e5; }
            </style>
          </head>
          <body>
            <h1>🔌 অফলাইন</h1>
            <p>ইন্টারনেট সংযোগ নেই। পুনরায় চেষ্টা করুন।</p>
            <button onclick="location.reload()">পুনরায় চেষ্টা</button>
          </body>
        </html>
      `);
    }
  });

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
