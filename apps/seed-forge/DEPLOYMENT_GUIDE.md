# The Seed Engine - 部署指南

## 🎯 部署方案总览

你的系统现在支持三种部署方式：

1. **PWA（渐进式网页应用）** - 最简单，无需安装
2. **Tauri 桌面应用** - Windows/Mac/Linux 原生应用
3. **Capacitor 手机应用** - Android/iOS 原生应用

---

## 📱 方案 1: PWA（渐进式网页应用）

### ✅ 已完成配置

- ✅ `public/manifest.json` - PWA 清单文件
- ✅ `public/sw.js` - Service Worker
- ✅ `vite.config.ts` - Vite PWA 插件配置
- ✅ `index.html` - Manifest 链接
- ✅ `src/main.tsx` - Service Worker 注册

### 🚀 使用方法

1. **构建应用**:
   ```bash
   npm run build
   ```

2. **预览应用**:
   ```bash
   npm run preview:pwa
   ```

3. **部署到服务器**:
   - 将 `dist/` 文件夹上传到任何静态托管服务
   - 例如：Vercel, Netlify, GitHub Pages

4. **添加到主屏幕**:
   - 在手机浏览器中打开应用
   - 点击"添加到主屏幕"
   - 应用会像原生应用一样运行

### 📋 功能特性

- ✅ 离线支持（Service Worker）
- ✅ 添加到主屏幕
- ✅ 全屏模式
- ✅ 快速启动
- ✅ 无需安装

---

## 💻 方案 2: Tauri 桌面应用

### 📦 前置要求

1. **安装 Rust**:
   - 访问: https://www.rust-lang.org/tools/install
   - 或运行: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`

2. **验证安装**:
   ```bash
   rustc --version
   ```

### 🚀 快速设置（Windows）

```powershell
# 运行设置脚本
.\scripts\setup-tauri.ps1
```

### 🚀 快速设置（Mac/Linux）

```bash
# 运行设置脚本
chmod +x scripts/setup-tauri.sh
./scripts/setup-tauri.sh
```

### 🔧 手动设置

1. **安装 Tauri CLI**:
   ```bash
   npm install --save-dev @tauri-apps/cli @tauri-apps/api
   ```

2. **初始化 Tauri**:
   ```bash
   npx tauri init
   ```
   
   回答提示：
   - App name: `The Seed Engine`
   - Window title: `The Seed Engine`
   - Dist dir: `../dist`
   - Dev path: `http://localhost:5173`
   - Build command: `npm run build`

3. **开发模式运行**:
   ```bash
   npm run tauri:dev
   ```

4. **构建桌面应用**:
   ```bash
   npm run build
   npm run tauri:build
   ```

5. **输出位置**:
   - Windows: `src-tauri/target/release/The Seed Engine.exe`
   - Mac: `src-tauri/target/release/The Seed Engine.app`
   - Linux: `src-tauri/target/release/The Seed Engine`

### 📋 功能特性

- ✅ 超轻量（几 MB）
- ✅ 原生性能
- ✅ 跨平台支持
- ✅ 系统集成
- ✅ 自动更新支持

---

## 📱 方案 3: Capacitor 手机应用

### 📦 前置要求

1. **Android 开发**:
   - Android Studio
   - JDK 11+
   - Android SDK

2. **iOS 开发** (仅 Mac):
   - Xcode
   - CocoaPods

### 🚀 快速设置（Windows）

```powershell
# 运行设置脚本
.\scripts\setup-capacitor.ps1
```

### 🚀 快速设置（Mac/Linux）

```bash
# 运行设置脚本
chmod +x scripts/setup-capacitor.sh
./scripts/setup-capacitor.sh
```

### 🔧 手动设置

1. **安装 Capacitor**:
   ```bash
   npm install @capacitor/core @capacitor/cli
   npm install @capacitor/app @capacitor/haptics @capacitor/keyboard @capacitor/status-bar
   ```

2. **初始化 Capacitor**:
   ```bash
   npx cap init "The Seed Engine" "com.taowind.seed"
   ```

3. **添加平台**:
   ```bash
   npx cap add android
   npx cap add ios  # 仅 Mac
   ```

4. **构建并同步**:
   ```bash
   npm run build
   npx cap sync
   ```

5. **打开开发环境**:
   ```bash
   # Android
   npx cap open android
   
   # iOS (仅 Mac)
   npx cap open ios
   ```

6. **构建 APK** (Android):
   ```bash
   cd android
   ./gradlew assembleDebug
   # APK 位置: android/app/build/outputs/apk/debug/app-debug.apk
   ```

### 📋 功能特性

- ✅ 原生性能
- ✅ 访问设备功能
- ✅ 应用商店发布
- ✅ 离线运行
- ✅ 推送通知支持

---

## 🎯 推荐部署顺序

### 1. 立即可用：PWA
```bash
npm run build
npm run preview:pwa
```
- ✅ 最快实现
- ✅ 无需额外工具
- ✅ 跨平台支持

### 2. 作品集展示：Tauri
```bash
# 安装 Rust 后
npm run tauri:build
```
- ✅ 最有冲击力
- ✅ 专业桌面应用
- ✅ 适合演示

### 3. 移动体验：Capacitor
```bash
# 安装 Android Studio 后
npm run cap:android
```
- ✅ 最佳移动体验
- ✅ 应用商店发布
- ✅ 原生功能

---

## 📝 构建脚本说明

### PWA
- `npm run build:pwa` - 构建 PWA 版本
- `npm run preview:pwa` - 预览构建结果

### Tauri
- `npm run tauri:dev` - 开发模式运行
- `npm run tauri:build` - 构建桌面应用

### Capacitor
- `npm run cap:sync` - 同步到原生项目
- `npm run cap:android` - 打开 Android Studio
- `npm run cap:ios` - 打开 Xcode (仅 Mac)

---

## 🎨 图标准备

PWA 需要以下图标文件（放在 `public/` 目录）：

- `icon-192.png` - 192x192 像素
- `icon-512.png` - 512x512 像素

你可以使用在线工具生成：
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

---

## 🚀 部署到生产环境

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

### GitHub Pages
1. 在 `package.json` 中添加：
   ```json
   "homepage": "https://yourusername.github.io/seed-engine"
   ```
2. 安装 `gh-pages`:
   ```bash
   npm install --save-dev gh-pages
   ```
3. 添加脚本：
   ```json
   "deploy": "npm run build && gh-pages -d dist"
   ```
4. 部署：
   ```bash
   npm run deploy
   ```

---

## ✅ 完成状态

- ✅ PWA 配置完成
- ✅ Tauri 设置脚本完成
- ✅ Capacitor 设置脚本完成
- ✅ 构建脚本完成
- ✅ 部署指南完成

**你的系统现在已经可以部署到所有平台！**

