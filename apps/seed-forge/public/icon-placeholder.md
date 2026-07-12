# PWA 图标文件说明

PWA 需要以下图标文件，请将它们放在 `public/` 目录下：

## 必需图标

1. **icon-192.png** - 192x192 像素
2. **icon-512.png** - 512x512 像素

## 生成图标

你可以使用以下工具生成图标：

1. **在线工具**:
   - https://realfavicongenerator.net/
   - https://www.pwabuilder.com/imageGenerator
   - https://www.favicon-generator.org/

2. **设计建议**:
   - 使用 The Seed Engine 的 Logo
   - 背景色：深蓝色 (#0f172a)
   - 主色调：青色 (#0ea5e9)
   - 可以是简单的几何图形或符号

3. **临时方案**:
   - 可以使用任何 192x192 和 512x512 的 PNG 图片作为占位符
   - 后续可以替换为正式 Logo

## 快速生成

如果你有 Logo 文件，可以使用 ImageMagick 或在线工具调整大小：

```bash
# 使用 ImageMagick (如果已安装)
convert logo.png -resize 192x192 public/icon-192.png
convert logo.png -resize 512x512 public/icon-512.png
```

或者使用在线工具上传你的 Logo，自动生成所有尺寸。

