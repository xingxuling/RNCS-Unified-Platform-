# 如何将项目克隆并连接到 Lovable

## 📋 步骤说明

### 方式 1: 如果项目已经在 Git 仓库中

#### 步骤 1: 获取 Git 仓库 URL

```bash
# 查看远程仓库地址
git remote -v
```

#### 步骤 2: 在 Lovable 中导入项目

1. **访问 Lovable**: https://lovable.dev
2. **创建新项目** 或 **导入现有项目**
3. **选择 "Import from Git"**
4. **输入 Git 仓库 URL**
5. **完成导入**

---

### 方式 2: 如果项目还没有 Git 仓库

#### 步骤 1: 创建 Git 仓库

**选项 A: GitHub**

1. 访问 https://github.com/new
2. 创建新仓库（例如：`aether-seed-forge`）
3. **不要**初始化 README、.gitignore 或 license（项目已有）

#### 步骤 2: 初始化并推送

```bash
# 1. 初始化 Git（如果还没有）
git init

# 2. 添加所有文件
git add .

# 3. 提交
git commit -m "Initial commit: The Seed Engine"

# 4. 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/aether-seed-forge.git

# 5. 推送
git branch -M main
git push -u origin main
```

#### 步骤 3: 在 Lovable 中导入

1. 访问 https://lovable.dev
2. 创建新项目 → **Import from Git**
3. 输入你的 GitHub 仓库 URL
4. 完成导入

---

### 方式 3: 直接使用现有的 Lovable 项目

**你的项目已经在 Lovable 中！**

项目地址: https://lovable.dev/projects/19de0b14-1f7e-468f-93f3-c5daedea79e2

**直接使用**:
1. 访问上面的链接
2. 开始开发
3. 所有更改会自动保存到 Git 仓库

---

## 🔄 同步本地和 Lovable

### 从 Lovable 拉取更改

```bash
# 在本地项目目录
git pull origin main
```

### 推送本地更改到 Lovable

```bash
# 1. 添加更改
git add .

# 2. 提交
git commit -m "Your changes"

# 3. 推送
git push origin main
```

**Lovable 会自动同步**，几分钟后就能看到你的更改。

---

## 📦 完整克隆流程（新机器）

### 步骤 1: 克隆项目

```bash
# 克隆仓库（替换为你的 Git URL）
git clone https://github.com/YOUR_USERNAME/aether-seed-forge.git

# 进入项目目录
cd aether-seed-forge
```

### 步骤 2: 安装依赖

```bash
npm install
```

### 步骤 3: 启动开发服务器

```bash
npm run dev
```

### 步骤 4: 访问应用

打开浏览器: `http://localhost:8080`

---

## 🔗 Lovable 项目连接

### 如果项目已经在 Lovable 中

**项目 URL**: https://lovable.dev/projects/19de0b14-1f7e-468f-93f3-c5daedea79e2

**连接方式**:
1. Lovable 会自动连接到 Git 仓库
2. 在 Lovable 中的更改会自动提交到 Git
3. 在本地推送的更改会自动同步到 Lovable

### 检查连接状态

在 Lovable 项目中：
1. 点击 **Settings**（设置）
2. 查看 **Git Repository** 部分
3. 确认仓库 URL 正确

---

## ✅ 验证步骤

### 1. 检查 Git 配置

```bash
# 查看远程仓库
git remote -v

# 应该显示类似：
# origin  https://github.com/YOUR_USERNAME/aether-seed-forge.git (fetch)
# origin  https://github.com/YOUR_USERNAME/aether-seed-forge.git (push)
```

### 2. 测试推送

```bash
# 做一个小的更改
echo "# Test" >> test.md

# 提交并推送
git add test.md
git commit -m "Test commit"
git push origin main
```

### 3. 在 Lovable 中验证

1. 访问 Lovable 项目
2. 等待几分钟（自动同步）
3. 检查 `test.md` 文件是否出现

---

## 🎯 推荐工作流程

### 日常开发

1. **在 Lovable 中开发**（快速迭代）
   - 访问: https://lovable.dev/projects/19de0b14-1f7e-468f-93f3-c5daedea79e2
   - 所有更改自动保存到 Git

2. **本地测试**（深度调试）
   ```bash
   git pull
   npm install
   npm run dev
   ```

3. **推送更改**（如果需要）
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```

---

## 🆘 常见问题

### Q: Lovable 项目如何连接到 Git？

A: Lovable 项目在创建时可以选择连接 Git 仓库。如果已经创建，可以在 Settings → Git Repository 中连接。

### Q: 本地更改如何同步到 Lovable？

A: 推送更改到 Git 仓库，Lovable 会自动同步（通常几分钟内）。

### Q: Lovable 中的更改如何同步到本地？

A: 在本地执行 `git pull` 即可。

### Q: 如何确认项目已连接？

A: 在 Lovable 项目设置中查看 Git Repository 部分，应该显示仓库 URL。

---

## ✅ 完成！

按照上面的步骤，你就可以：
- ✅ 在本地克隆项目
- ✅ 在 Lovable 中使用项目
- ✅ 两者自动同步

**推荐**: 直接在 Lovable 中开发，无需本地配置！

