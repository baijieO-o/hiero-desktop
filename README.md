# Hiero Desktop

Hiero 的 Windows 桌面版（Electron 外壳）。与 `D:\hiero` 工作区相互独立。

## 结构

- `src/main.js`：Electron 主进程。启动后端、等待 UI 就绪、打开窗口，退出时结束后端。
- `backend/`：从 `D:\hiero` 构建产物复制而来（`dist/`、`frontend/dist/`），以及运行时依赖。
- 后端数据目录：`%APPDATA%\HieroDesktop`（`.env` 等配置存放于此）。

## 开发运行

```powershell
npm install
node node_modules/electron/install.js   # 若 electron.exe 缺失
npm start
```

## 打包安装程序

```powershell
npm run dist    # 输出到 dist-app\
```

## 更新后端

在 `D:\hiero` 执行 `npm run build` 与前端构建后，将 `dist/` 和 `frontend/dist/` 复制到本项目的 `backend/` 下，并重新安装 `backend` 的运行依赖。

## 注意

- 后端 WebSocket 仅接受本机回环连接（端口 8080），UI 静态服务监听 `127.0.0.1:5173`。
- `backend/dist`、`backend/frontend`、`backend/node_modules` 是构建产物，不纳入版本库。
