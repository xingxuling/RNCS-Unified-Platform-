# The Seed Engine - 故障排查指南

## 🚫 ERR_CONNECTION_REFUSED 错误解决

### 问题诊断

**ERR_CONNECTION_REFUSED** 表示浏览器无法连接到开发服务器。

**可能原因**:
1. 开发服务器没有运行
2. 端口被占用
3. 防火墙拦截
4. Node.js 版本问题
5. 缓存问题

---

## ✅ 解决方案

### 方案 1: 启动开发服务器（最重要）

```bash
# 在项目根目录执行
npm run dev
```

**正常输出应该类似**:
```
VITE v5.x  ready in 800ms
➜  Local:   http://localhost:8080/
➜  Network: use --host to expose
```

**如果看到这个输出**:
- ✅ 服务器已启动
- ✅ 访问显示的地址（通常是 `http://localhost:8080`）
- ✅ 如果浏览器还是报错，继续看下面的方案

---

### 方案 2: 端口被占用

**如果看到**:
```
Port 8080 is already in use
```

**解决方法**:

**Windows**:
```bash
# 方法 1: 使用 kill-port
npx kill-port 8080
npm run dev

# 方法 2: 查找并结束进程
netstat -ano | findstr :8080
taskkill /PID <进程ID> /F
```

**Mac/Linux**:
```bash
# 查找进程
lsof -i :8080

# 结束进程
kill -9 <进程ID>
```

**或者换一个端口**:
```bash
npm run dev -- --port 3000
```

然后访问 `http://localhost:3000`

---

### 方案 3: Node.js 版本问题

**检查版本**:
```bash
node -v
```

**要求**: Node.js ≥ 18

**如果版本太低**:
1. 访问: https://nodejs.org
2. 下载并安装最新 LTS 版本
3. 重新运行 `npm run dev`

---

### 方案 4: 清除缓存

**清除 Node 缓存**:
```bash
# 删除 node_modules 和缓存
rm -rf node_modules
rm -rf .vite
npm install
npm run dev
```

**Windows PowerShell**:
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force .vite
npm install
npm run dev
```

**清除浏览器缓存**:
1. 打开开发者工具 (F12)
2. 右键点击刷新按钮
3. 选择"清空缓存并硬性重新加载"

---

### 方案 5: 防火墙问题

**Windows**:
1. 打开"Windows Defender 防火墙"
2. 暂时关闭防火墙测试
3. 如果成功，再重新打开并添加例外

**或者添加端口例外**:
1. 控制面板 → Windows Defender 防火墙
2. 高级设置 → 入站规则 → 新建规则
3. 端口 → TCP → 8080 → 允许连接

---

### 方案 6: 删除 PWA 文件（开发环境）

如果开发时遇到问题，可以临时删除 PWA 文件：

```bash
# 备份后删除
mv public/sw.js public/sw.js.bak
mv public/manifest.webmanifest public/manifest.webmanifest.bak

# 重新启动
npm run dev
```

**注意**: 这只是临时方案，构建 PWA 时需要这些文件

---

## 🔍 详细诊断步骤

### 步骤 1: 检查服务器是否运行

```bash
# 检查端口占用
netstat -ano | findstr :8080  # Windows
lsof -i :8080                  # Mac/Linux
```

### 步骤 2: 检查 Node.js 环境

```bash
node -v
npm -v
```

### 步骤 3: 检查依赖

```bash
npm install
```

### 步骤 4: 尝试不同端口

```bash
# 使用 3000 端口
npm run dev -- --port 3000

# 使用 5173 端口
npm run dev -- --port 5173
```

---

## 🚀 快速修复流程

### 最可能的问题（按优先级）

1. **服务器没启动** → 运行 `npm run dev`
2. **端口被占用** → 使用 `npx kill-port 8080` 或换端口
3. **Node 版本低** → 升级到 Node 18+
4. **缓存问题** → 清除缓存重新安装
5. **防火墙** → 暂时关闭测试

---

## ✅ 验证修复

### 成功标志

1. **终端显示**:
   ```
   VITE v5.x  ready in XXXms
   ➜  Local:   http://localhost:8080/
   ```

2. **浏览器访问**:
   - 打开 `http://localhost:8080`
   - 应用正常加载
   - 没有 ERR_CONNECTION_REFUSED 错误

3. **功能正常**:
   - 可以访问各个页面
   - 功能正常工作
   - 没有控制台错误

---

## 📋 常见错误对照表

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| ERR_CONNECTION_REFUSED | 服务器未运行 | `npm run dev` |
| Port is already in use | 端口被占用 | `npx kill-port 8080` |
| Cannot find module | 依赖缺失 | `npm install` |
| Node version error | Node 版本低 | 升级 Node.js |
| EADDRINUSE | 端口冲突 | 换端口或结束进程 |

---

## 🆘 如果还是无法解决

### 提供以下信息

1. **终端输出**:
   ```bash
   npm run dev
   ```
   复制完整的输出

2. **Node 版本**:
   ```bash
   node -v
   npm -v
   ```

3. **端口占用情况**:
   ```bash
   netstat -ano | findstr :8080  # Windows
   ```

4. **错误截图**:
   - 浏览器错误页面
   - 终端错误信息

---

## 🎯 最简修复流程

```bash
# 1. 确保在项目根目录
cd aether-seed-forge-main

# 2. 清除缓存
rm -rf node_modules .vite
npm install

# 3. 启动服务器
npm run dev

# 4. 访问显示的地址（通常是 http://localhost:8080）
```

---

## ✅ 完成！

按照上面的步骤，应该可以解决 ERR_CONNECTION_REFUSED 错误。

如果还有问题，请提供：
- `npm run dev` 的完整输出
- 浏览器错误信息
- Node.js 版本

我会继续帮你排查！

