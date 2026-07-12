# The Seed Engine - 快速部署指南

## 🚀 立即开始

### 第一步：安装 PWA 依赖

```bash
npm install
```

这会自动安装 `vite-plugin-pwa` 和其他依赖。

---

## 📱 方案 1: PWA（最简单，立即可用）

### 1. 构建应用

```bash
npm run build
```

### 2. 预览

```bash
npm run preview
```

### 3. 访问

打开浏览器访问 `http://localhost:4173`

### 4. 添加到主屏幕

- **手机**: 在浏览器中点击"添加到主屏幕"
- **电脑**: Chrome 会提示"安装应用"

### ✅ 完成！

现在你的应用已经可以作为 PWA 运行了。

---

## 💻 方案 2: Tauri 桌面应用

### 前置要求

1. **安装 Rust**:
   - Windows: 访问 https://www.rust-lang.org/tools/install
   - Mac/Linux: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`

2. **验证安装**:
   ```bash
   rustc --version
   ```

### 快速设置

**Windows**:
```powershell
.\scripts\setup-tauri.ps1
```

**Mac/Linux**:
```bash
chmod +x scripts/setup-tauri.sh
./scripts/setup-tauri.sh
```

### 开发模式

```bash
npm run tauri:dev
```

### 构建应用

```bash
npm run build
npm run tauri:build
```

### 输出位置

- Windows: `src-tauri/target/release/The Seed Engine.exe`
- Mac: `src-tauri/target/release/The Seed Engine.app`
- Linux: `src-tauri/target/release/The Seed Engine`

---

## 📱 方案 3: Capacitor 手机应用

### 前置要求

1. **Android 开发**:
   - 安装 Android Studio
   - 安装 JDK 11+
   - 配置 Android SDK

2. **iOS 开发** (仅 Mac):
   - 安装 Xcode
   - 安装 CocoaPods

### 快速设置

**Windows**:
```powershell
.\scripts\setup-capacitor.ps1
```

**Mac/Linux**:
```bash
chmod +x scripts/setup-capacitor.sh
./scripts/setup-capacitor.sh
```

### 打开开发环境

```bash
# Android
npm run cap:android

# iOS (仅 Mac)
npm run cap:ios
```

### 构建 APK (Android)

```bash
cd android
./gradlew assembleDebug
```

APK 位置: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🎯 推荐顺序

1. **PWA** - 最快，无需额外工具
2. **Tauri** - 专业桌面应用
3. **Capacitor** - 移动端体验

---

## 📝 注意事项

### PWA
- 需要准备图标文件（192x192, 512x512）
- 生产环境需要 HTTPS

### Tauri
- 首次构建时间较长（需要编译 Rust）
- 需要配置代码签名（发布时）

### Capacitor
- Android 需要 Android Studio
- iOS 需要 Mac + Xcode

---

## ✅ 完成！

你的系统现在已经可以部署到所有平台了！

查看 `DEPLOYMENT_GUIDE.md` 获取更详细的说明。

