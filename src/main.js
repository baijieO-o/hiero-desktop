import { app, BrowserWindow, dialog } from 'electron';
import { fork } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const serverEntry = join(here, '..', 'backend', 'dist', 'src', 'server.js');
const UI_PORT = Number(process.env.HIERO_UI_PORT ?? 5173);
const UI_URL = `http://localhost:${UI_PORT}`;

// .env is read from the working directory (see llm-env.ts), so keep it in a per-user folder.
const dataDir = join(app.getPath('appData'), 'HieroDesktop');
mkdirSync(dataDir, { recursive: true });

let backend;
let mainWindow;

function startBackend() {
  backend = fork(serverEntry, [], {
    cwd: dataDir,
    env: { ...process.env, HIERO_UI_PORT: String(UI_PORT) },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });
  backend.stdout.on('data', (chunk) => process.stdout.write(chunk));
  backend.stderr.on('data', (chunk) => process.stderr.write(chunk));
  backend.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      dialog.showErrorBox('Hiero', `后端异常退出（代码 ${code}）。`);
    }
  });
}

async function waitForUi(timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(UI_URL);
      if (res.ok) return true;
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'Hiero',
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  mainWindow.setMenuBarVisibility(false);

  if (!(await waitForUi())) {
    dialog.showErrorBox('Hiero', `界面服务未在 ${UI_URL} 启动。`);
    app.quit();
    return;
  }
  await mainWindow.loadURL(UI_URL);
}

app.whenReady().then(() => {
  if (!existsSync(serverEntry)) {
    dialog.showErrorBox('Hiero', '找不到后端入口，安装包可能不完整。');
    app.quit();
    return;
  }
  startBackend();
  createWindow();
});

app.on('window-all-closed', () => app.quit());

app.on('before-quit', () => {
  if (backend && !backend.killed) backend.kill('SIGINT');
});
