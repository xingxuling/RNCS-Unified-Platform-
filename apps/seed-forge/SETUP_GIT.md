# 设置 Git 仓库并连接到 Lovable

## 📋 当前状态

你的项目**还没有 Git 仓库**。我们需要先初始化 Git，然后连接到 Lovable。

---

## 🚀 完整设置流程

### 步骤 1: 初始化 Git 仓库

```bash
# 在项目根目录执行
git init
```

### 步骤 2: 创建 .gitignore（如果还没有）

检查是否有 `.gitignore` 文件，如果没有，创建：

```bash
# 创建 .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
dist/
build/

# Misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Editor
.vscode/
.idea/
*.swp
*.swo
*~

# OS
Thumbs.db

# Vite
.vite/
*.local

# Tauri
src-tauri/target/
EOF
```

### 步骤 3: 添加所有文件

```bash
git add .
```

### 步骤 4: 创建初始提交

```bash
git commit -m "Initial commit: The Seed Engine - Civilization Fate Simulator"
```

### 步骤 5: 创建 GitHub 仓库

1. **访问**: https://github.com/new
2. **仓库名称**: `aether-seed-forge`（或你喜欢的名字）
3. **描述**: "The Seed Engine - Civilization Fate Simulator with AGI Shell"
4. **选择**: Public 或 Private
5. **不要**勾选：
   - ❌ Add a README file
   - ❌ Add .gitignore
   - ❌ Choose a license
6. **点击**: "Create repository"

### 步骤 6: 连接远程仓库

```bash
# 替换 YOUR_USERNAME 为你的 GitHub 用户名
git remote add origin https://github.com/YOUR_USERNAME/aether-seed-forge.git

# 或者使用 SSH（如果你配置了 SSH key）
# git remote add origin git@github.com:YOUR_USERNAME/aether-seed-forge.git
```

### 步骤 7: 推送代码

```bash
# 重命名分支为 main（如果还没有）
git branch -M main

# 推送代码
git push -u origin main
```

---

## 🔗 连接到 Lovable

### 方式 1: 在现有 Lovable 项目中连接 Git

1. **访问你的 Lovable 项目**: 
   https://lovable.dev/projects/19de0b14-1f7e-468f-93f3-c5daedea79e2

2. **进入设置**:
   - 点击左侧菜单的 **Settings**（设置）
   - 或访问: https://lovable.dev/projects/19de0b14-1f7e-468f-93f3-c5daedea79e2/settings

3. **连接 Git 仓库**:
   - 找到 **Git Repository** 部分
   - 点击 **Connect Repository**
   - 输入你的 GitHub 仓库 URL: `https://github.com/YOUR_USERNAME/aether-seed-forge.git`
   - 授权 GitHub 访问（如果需要）
   - 完成连接

### 方式 2: 创建新的 Lovable 项目并导入

1. **访问**: https://lovable.dev
2. **创建新项目** → **Import from Git**
3. **输入 GitHub 仓库 URL**
4. **完成导入**

---

## ✅ 验证连接

### 1. 检查 Git 配置

```bash
# 查看远程仓库
git remote -v

# 应该显示：
# origin  https://github.com/YOUR_USERNAME/aether-seed-forge.git (fetch)
# origin  https://github.com/YOUR_USERNAME/aether-seed-forge.git (push)
```

### 2. 测试同步

**从本地推送到 Lovable**:
```bash
# 做一个小的更改
echo "# Test" >> test.md
git add test.md
git commit -m "Test: Verify Git connection"
git push origin main
```

**在 Lovable 中验证**:
1. 等待几分钟（自动同步）
2. 检查 `test.md` 文件是否出现

**从 Lovable 拉取到本地**:
```bash
# 在 Lovable 中做一个更改，然后：
git pull origin main
```

---

## 🎯 推荐工作流程

### 日常开发

1. **在 Lovable 中开发**（快速迭代）
   - 访问: https://lovable.dev/projects/19de0b14-1f7e-468f-93f3-c5daedea79e2
   - 所有更改自动保存到 Git

2. **本地测试**（深度调试）
   ```bash
   git pull origin main
   npm install
   npm run dev
   ```

3. **推送本地更改**（如果需要）
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

---

## 🆘 常见问题

### Q: 如何找到我的 GitHub 用户名？

A: 访问 https://github.com，登录后右上角显示的就是你的用户名。

### Q: 如何创建 GitHub 仓库？

A: 访问 https://github.com/new，按照上面的步骤 5 操作。

### Q: Lovable 会自动同步吗？

A: 是的！在 Lovable 中的更改会自动提交到 Git 仓库。本地推送的更改也会自动同步到 Lovable（通常几分钟内）。

### Q: 如何确认连接成功？

A: 在 Lovable 项目设置中查看 Git Repository 部分，应该显示你的仓库 URL。

---

## 📝 快速命令总结

```bash
# 1. 初始化 Git
git init

# 2. 添加文件
git add .

# 3. 提交
git commit -m "Initial commit: The Seed Engine"

# 4. 添加远程仓库（替换 YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/aether-seed-forge.git

# 5. 推送
git branch -M main
git push -u origin main
```

---

## ✅ 完成！

设置完成后，你就可以：
- ✅ 在本地使用 Git 管理代码
- ✅ 在 Lovable 中开发
- ✅ 两者自动同步

**下一步**: 在 Lovable 项目设置中连接你的 Git 仓库！

