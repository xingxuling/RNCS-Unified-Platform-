# The Seed Engine - Lovable 项目使用指南

## 🌟 Lovable 项目说明

这是一个 **Lovable 平台项目**，有两种使用方式：

### 方式 1: 在 Lovable 平台上开发（推荐）

**项目地址**: https://lovable.dev/projects/19de0b14-1f7e-468f-93f3-c5daedea79e2

**优点**:
- ✅ 无需本地配置
- ✅ 自动保存和部署
- ✅ 在线预览
- ✅ AI 辅助开发

**使用方法**:
1. 访问 [Lovable 项目页面](https://lovable.dev/projects/19de0b14-1f7e-468f-93f3-c5daedea79e2)
2. 直接在浏览器中编辑和预览
3. 所有更改自动保存到 Git 仓库

---

### 方式 2: 本地开发

如果你想在本地 IDE 中开发：

#### 步骤 1: 克隆项目

```bash
# 克隆仓库
git clone <YOUR_GIT_URL>
cd aether-seed-forge-main
```

#### 步骤 2: 安装依赖

```bash
npm install
```

#### 步骤 3: 启动开发服务器

```bash
npm run dev
```

**正常输出**:
```
VITE v5.x  ready in XXXms
➜  Local:   http://localhost:8080/
➜  Network: use --host to expose
```

#### 步骤 4: 访问应用

打开浏览器访问: **http://localhost:8080**

---

## 🚫 ERR_CONNECTION_REFUSED 错误解决

### 问题诊断

如果你看到 `ERR_CONNECTION_REFUSED`，说明：

1. **开发服务器没有运行**，或
2. **端口被占用**，或
3. **防火墙拦截**

### 解决方案

#### 方案 1: 检查服务器是否运行

```bash
# 检查 8080 端口是否被占用
netstat -ano | findstr :8080  # Windows
lsof -i :8080                  # Mac/Linux
```

**如果端口被占用**:
```bash
# Windows: 结束进程
taskkill /PID <进程ID> /F

# 或使用 kill-port
npx kill-port 8080

# 然后重新启动
npm run dev
```

#### 方案 2: 使用不同端口

```bash
# 使用 3000 端口
npm run dev -- --port 3000

# 然后访问 http://localhost:3000
```

#### 方案 3: 清除缓存重新启动

```bash
# 清除缓存
rm -rf node_modules/.vite
rm -rf dist

# 重新启动
npm run dev
```

#### 方案 4: 检查 Node.js 版本

```bash
node -v
```

**要求**: Node.js ≥ 18

如果版本太低，请升级: https://nodejs.org

---

## 🔍 当前状态检查

根据你的系统检查：

### 端口占用情况

```bash
# 检查 8080 端口（开发服务器）
netstat -ano | findstr :8080

# 检查 4173 端口（预览服务器）
netstat -ano | findstr :4173
```

### 如果端口已被占用

**选项 A: 结束占用进程**
```bash
# Windows
taskkill /PID <进程ID> /F

# Mac/Linux
kill -9 <进程ID>
```

**选项 B: 使用不同端口**
```bash
npm run dev -- --port 3000
```

---

## ✅ 快速修复流程

### 最简步骤

```bash
# 1. 确保在项目根目录
cd aether-seed-forge-main

# 2. 安装依赖（如果还没安装）
npm install

# 3. 清除可能的端口占用
npx kill-port 8080

# 4. 启动开发服务器
npm run dev

# 5. 访问显示的地址（通常是 http://localhost:8080）
```

---

## 🎯 Lovable 平台 vs 本地开发

### 使用 Lovable 平台（推荐）

**适合**:
- ✅ 快速原型开发
- ✅ AI 辅助编程
- ✅ 无需配置环境
- ✅ 自动部署

**访问**: https://lovable.dev/projects/19de0b14-1f7e-468f-93f3-c5daedea79e2

### 使用本地开发

**适合**:
- ✅ 深度定制
- ✅ 使用自己的 IDE
- ✅ 离线开发
- ✅ 完整控制

**步骤**:
```bash
git clone <YOUR_GIT_URL>
cd aether-seed-forge-main
npm install
npm run dev
```

---

## 📱 部署到生产环境

### 方式 1: 通过 Lovable 部署（最简单）

1. 访问 [Lovable 项目](https://lovable.dev/projects/19de0b14-1f7e-468f-93f3-c5daedea79e2)
2. 点击 **Share → Publish**
3. 自动生成部署链接

### 方式 2: 手动部署

```bash
# 1. 构建生产版本
npm run build

# 2. 部署到 Vercel/Netlify/GitHub Pages
# Vercel
vercel

# Netlify
netlify deploy --prod

# GitHub Pages
npm run deploy
```

---

## 🆘 如果还是无法解决

### 提供以下信息

1. **终端输出**:
   ```bash
   npm run dev
   ```
   复制完整的输出

2. **端口占用**:
   ```bash
   netstat -ano | findstr :8080
   ```

3. **Node 版本**:
   ```bash
   node -v
   npm -v
   ```

4. **错误截图**:
   - 浏览器错误页面
   - 终端错误信息

---

## 🎉 推荐工作流程

### 日常开发

1. **在 Lovable 平台上开发**（快速迭代）
2. **本地测试**（深度调试）
3. **通过 Lovable 部署**（一键发布）

### 本地开发流程

```bash
# 1. 拉取最新代码
git pull

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 4. 访问 http://localhost:8080

# 5. 开发完成后推送到 Git
git add .
git commit -m "Your changes"
git push
```

---

## ✅ 完成！

按照上面的步骤，应该可以解决 ERR_CONNECTION_REFUSED 错误。

**推荐**: 如果只是想快速使用，直接在 Lovable 平台上开发即可，无需本地配置！

