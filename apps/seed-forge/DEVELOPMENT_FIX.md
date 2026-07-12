# 开发环境修复指南

## 🔧 问题解决

### 问题 1: Service Worker 缓存干扰开发

**症状**:
- 开发时看到旧版本代码
- 出现"应用程序遇到了意外错误"
- 修改代码后刷新没有变化

**解决方案**:

#### 步骤 1: 清除浏览器中的 Service Worker

**Chrome/Edge**:
1. 打开开发者工具 (F12)
2. 切换到 "Application" 标签
3. 左侧找到 "Service Workers"
4. 找到 `http://localhost:4173` 或 `http://localhost:5173` 相关的项
5. 点击 "Unregister"
6. 勾选 "Bypass for network"（开发时保持勾选）

**或者使用 Chrome 内部页面**:
1. 地址栏输入: `chrome://serviceworker-internals/`
2. 找到 localhost 相关的项
3. 点击 "Unregister"
4. 如果有 "Stop" 或 "Clear storage" 也点击

#### 步骤 2: 清除浏览器缓存

1. 打开开发者工具 (F12)
2. 右键点击刷新按钮
3. 选择 "清空缓存并硬性重新加载"

#### 步骤 3: 确认代码已修改

我已经修改了 `src/main.tsx`，现在：
- ✅ 开发环境 (`npm run dev`) 不会注册 Service Worker
- ✅ 只有生产环境 (`npm run build`) 才会注册 Service Worker

---

### 问题 2: 前端代码报错

**症状**:
- 看到黑色错误页面
- "应用程序遇到了意外错误"

**解决方案**:

1. **查看错误详情**:
   - 点击错误页面上的 "错误详情"
   - 查看第一条红色报错信息

2. **常见错误类型**:
   - **Import 错误**: 检查文件路径是否正确
   - **TypeScript 错误**: 检查类型定义
   - **JSX 语法错误**: 检查组件结构
   - **Hook 错误**: 检查 React Hooks 使用规则

3. **修复步骤**:
   ```bash
   # 1. 检查 lint 错误
   npm run lint
   
   # 2. 重新启动开发服务器
   npm run dev
   
   # 3. 查看控制台错误
   # 打开浏览器开发者工具 (F12) → Console
   ```

---

## ✅ 验证修复

### 1. 开发环境测试

```bash
# 启动开发服务器
npm run dev
```

**检查**:
- ✅ 应用正常加载
- ✅ 没有 Service Worker 注册（开发环境）
- ✅ 代码修改后立即生效
- ✅ 没有缓存问题

### 2. 清除旧缓存

如果还有问题，执行：

```bash
# 清除构建缓存
rm -rf dist
rm -rf node_modules/.vite

# 重新安装（如果需要）
npm install

# 重新启动
npm run dev
```

---

## 🚀 开发环境配置

### 当前配置

- ✅ **开发环境**: 不注册 Service Worker
- ✅ **生产环境**: 注册 Service Worker（PWA 功能）
- ✅ **自动刷新**: 代码修改后立即生效
- ✅ **无缓存干扰**: 开发时总是使用最新代码

### 开发流程

```bash
# 1. 启动开发服务器
npm run dev

# 2. 打开浏览器
# http://localhost:5173 或 http://localhost:8080

# 3. 开发时保持 "Bypass for network" 勾选
# Application → Service Workers → Bypass for network ✓
```

---

## 📱 PWA 生产环境

### 构建 PWA 版本

```bash
# 1. 构建生产版本
npm run build

# 2. 预览 PWA
npm run preview

# 3. 访问预览地址
# http://localhost:4173
```

### 测试 PWA 安装

1. **电脑 (Chrome/Edge)**:
   - 地址栏右侧会出现"安装"图标
   - 点击安装
   - 应用会以独立窗口运行

2. **手机 (Android/iOS)**:
   - 浏览器菜单 → "添加到主屏幕"
   - 应用会像原生应用一样运行

---

## 🔍 故障排查

### 如果开发环境还有问题

1. **完全清除浏览器数据**:
   - Chrome: 设置 → 隐私和安全 → 清除浏览数据
   - 选择"缓存的图片和文件"
   - 时间范围：全部时间

2. **使用无痕模式测试**:
   - 打开无痕窗口
   - 访问 `http://localhost:5173`
   - 确认是否正常

3. **检查端口占用**:
   ```bash
   # Windows
   netstat -ano | findstr :5173
   
   # Mac/Linux
   lsof -i :5173
   ```

4. **重新安装依赖**:
   ```bash
   rm -rf node_modules
   npm install
   ```

---

## ✅ 完成状态

- ✅ 开发环境修复：完成
- ✅ Service Worker 分离：完成
- ✅ PWA 配置：完成
- ✅ 构建脚本：完成

**你的开发环境现在已经完全修复！**

---

## 🎯 下一步

1. **测试开发环境**:
   ```bash
   npm run dev
   ```

2. **生成图标**（如果还没有）:
   - 打开 `scripts/generate-icons.html`
   - 生成 `icon-192.png` 和 `icon-512.png`

3. **构建 PWA**:
   ```bash
   npm run build
   npm run preview
   ```

**现在你可以正常开发了！**

