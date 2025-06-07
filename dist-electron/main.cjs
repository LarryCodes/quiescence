const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('path')
const url = require('url')

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// This is only needed for Windows Squirrel installer
if (process.platform === 'win32') {
  try {
    // Try to require electron-squirrel-startup if it exists
    if (require('electron-squirrel-startup')) {
      app.quit()
      return
    }
  } catch (error) {
    // Ignore if module not found (development)
    if (error.code !== 'MODULE_NOT_FOUND') {
      console.error('Error in Squirrel startup check:', error)
    }
  }
}

// Keep a global reference of the window object to prevent garbage collection
let mainWindow

/**
 * Create the main application window
 * @returns {BrowserWindow} The created browser window
 */
function createWindow() {
  // Create the browser window with sensible defaults
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false, // Don't show until ready-to-show
    titleBarStyle: 'hiddenInset', // For macOS
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      sandbox: true
    }
  })

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    // In development, load from the Vite dev server
    window.loadURL('http://localhost:5173')
    // Open DevTools in development mode
    window.webContents.openDevTools()
  } else {
    // In production, load the built files
    window.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Show window when page is ready
  window.once('ready-to-show', () => {
    window.show()
  })

  // Handle external links (open in default browser)
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  // Disable menu bar in production
  if (process.env.NODE_ENV !== 'development') {
    window.setMenuBarVisibility(false)
  }

  return window
}

/**
 * Set up IPC event handlers
 */
function setupIpcHandlers() {
  // Get application version
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion()
  })
  
  // Window controls
  ipcMain.on('app:minimize-window', () => {
    const window = BrowserWindow.getFocusedWindow()
    if (window) window.minimize()
  })
  
  ipcMain.on('app:maximize-window', () => {
    const window = BrowserWindow.getFocusedWindow()
    if (window) {
      if (window.isMaximized()) {
        window.unmaximize()
      } else {
        window.maximize()
      }
    }
  })
  
  ipcMain.on('app:close-window', () => {
    const window = BrowserWindow.getFocusedWindow()
    if (window) window.close()
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  // Create the main window
  mainWindow = createWindow()
  
  // Set up IPC handlers
  setupIpcHandlers()
  
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow()
    }
  })
  
  // Check for updates (you would implement this)
  // checkForUpdates()
})

// Quit when all windows are closed, except on macOS.
// On macOS it's common for applications to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  // You might want to log this to a file or show an error dialog
})

// Handle any unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  // You might want to log this to a file or show an error dialog
})

// Example of how you might implement an update checker
// This is a placeholder - you would need to implement the actual update logic
/**
 * Check for application updates
 * @returns {Promise<void>}
 */
async function checkForUpdates() {
  try {
    // This is where you would implement your update checking logic
    // For example, using electron-updater or your own update server
    console.log('Checking for updates...')
    // const update = await checkForUpdate()
    // if (update) {
    //   mainWindow.webContents.send('app:update-available', update)
    // }
  } catch (error) {
    console.error('Failed to check for updates:', error)
    mainWindow.webContents.send('app:error', {
      type: 'update',
      message: 'Failed to check for updates',
      error: error.message
    })
  }
}
