import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../assets/icon.png'),
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle('select-input-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Video Files', extensions: ['mp4', 'mkv'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('select-output-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('get-profiles', async () => {
  const fs = await import('fs/promises');
  const profilesDir = path.join(__dirname, '..', 'profiles');
  
  try {
    const files = await fs.readdir(profilesDir);
    const profiles = files
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace('.json', ''));
    return profiles;
  } catch (error) {
    console.error('Error reading profiles:', error);
    return ['toddler', 'pg']; // Fallback
  }
});

ipcMain.handle('sanitize', async (event, { inputPath, outputPath, profile }) => {
  return new Promise((resolve, reject) => {
    // Get the path to the compiled CLI
    // In production, use app.getAppPath(), in dev use __dirname
    const appPath = app.isPackaged 
      ? path.dirname(app.getAppPath())
      : path.join(__dirname, '..');
    const cliPath = path.join(appPath, 'dist', 'cli.js');
    
    // Spawn the sanitization process
    const sanitizeProcess = spawn('node', [cliPath, '-i', inputPath, '-p', profile, '-o', outputPath], {
      cwd: appPath,
    });

    let stdout = '';
    let stderr = '';

    sanitizeProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      // Send progress updates to renderer
      event.sender.send('sanitize-progress', data.toString());
    });

    sanitizeProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      event.sender.send('sanitize-progress', data.toString());
    });

    sanitizeProcess.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output: stdout });
      } else {
        reject({ success: false, error: stderr || stdout, code });
      }
    });

    sanitizeProcess.on('error', (error) => {
      reject({ success: false, error: error.message });
    });
  });
});

