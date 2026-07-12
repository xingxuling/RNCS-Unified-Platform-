# The Seed Engine - 快速部署指南（中文版）

## 🚀 快速开始

### 第一步：安装依赖

```bash
npm install
```

### 第二步：开发环境

```bash
# 启动开发服务器
npm run dev

# 访问
# http://localhost:5173 或 http://localhost:8080
```

**开发环境特点**:
- ✅ 不注册 Service Worker（避免缓存干扰）
- ✅ 热更新（代码修改立即生效）
- ✅ 无缓存问题

---

## 📱 PWA 部署（生产环境）

### 1. 准备图标

**方法 1: 使用 HTML 生成器（推荐）**

1. 在浏览器中打开 `scripts/generate-icons.html`
2. 点击"下载 192x192"和"下载 512x512"
3. 保存到 `public/` 目录

**方法 2: 使用 SVG 转换**

1. 访问 https://convertio.co/svg-png/
2. 上传 `public/icon-seed-simple.svg`
3. 转换并下载到 `public/` 目录

### 2. 构建应用

```bash
npm run build
```

### 3. 预览 PWA

```bash
npm run preview
```

访问 `http://localhost:4173`

### 4. 测试安装

- **手机**: 浏览器菜单 → "添加到主屏幕"
- **电脑**: 地址栏右侧 → "安装"图标

---

## 🌐 部署到生产环境

### 选项 1: Vercel（推荐）

```bash
# 安装 Vercel CLI
npm install -g vercel

# 部署
vercel
```

### 选项 2: Netlify

```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 部署
netlify deploy --prod
```

### 选项 3: GitHub Pages

1. 在 `package.json` 中添加：
   ```json
   "homepage": "https://yourusername.github.io/seed-engine"
   ```

2. 安装 gh-pages:
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

## 🔧 开发环境修复

### 如果遇到缓存问题

1. **清除 Service Worker**:
   - 打开开发者工具 (F12)
   - Application → Service Workers
   - 点击 "Unregister"
   - 勾选 "Bypass for network"

2. **清除浏览器缓存**:
   - 右键刷新按钮
   - 选择 "清空缓存并硬性重新加载"

3. **使用无痕模式测试**:
   - 打开无痕窗口
   - 访问开发地址

---

## ✅ 验证清单

### 开发环境
- [ ] `npm run dev` 正常启动
- [ ] 应用正常加载
- [ ] 代码修改立即生效
- [ ] 无 Service Worker 干扰

### PWA 生产环境
- [ ] 图标文件已准备（icon-192.png, icon-512.png）
- [ ] `npm run build` 成功
- [ ] `npm run preview` 正常
- [ ] 可以安装到主屏幕
- [ ] 离线功能正常

---

## 📋 文件结构

```
项目根目录/
  ├── public/
  │   ├── icon-192.png          ✅ 必需
  │   ├── icon-512.png          ✅ 必需
  │   ├── manifest.webmanifest  ✅ 已配置
  │   └── sw.js                 ✅ 已配置
  ├── src/
  │   └── main.tsx              ✅ 已修复（开发环境不注册 SW）
  ├── scripts/
  │   └── generate-icons.html   ✅ 图标生成器
  └── dist/                      📦 构建输出
```

---

## 🎯 下一步

1. **生成图标**（如果还没有）
2. **测试开发环境** (`npm run dev`)
3. **构建 PWA** (`npm run build && npm run preview`)
4. **部署到生产环境**

---

## 📚 相关文档

- `DEVELOPMENT_FIX.md` - 开发环境修复指南
- `PROFESSOR_GUIDE.md` - 教授使用指南
- `DEPLOYMENT_GUIDE.md` - 完整部署指南
- `ICON_GENERATION_GUIDE.md` - 图标生成指南

---

## 🎉 完成！

你的 The Seed Engine 现在已经：
- ✅ 开发环境完全修复
- ✅ PWA 配置完成
- ✅ 可以部署到生产环境
- ✅ 可以安装到手机/电脑

**开始使用吧！**

