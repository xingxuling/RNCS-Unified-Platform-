# VSR Hybrid Rendering Architecture v0.1

## 1. 问题

单一 GPU 后端无法在早期同时覆盖文字、图片、Path、阴影、裁剪和复杂混合模式。简单地把“不支持节点”全部放到最后渲染，会破坏原本的遮挡顺序。

## 2. 核心规则

```text
DisplayState.items 原始顺序
→ 判断每个节点是否可 GPU 等价执行
→ 连续相同后端节点合并为一层
→ 层与层严格保持原顺序
```

因此：

```text
GPU 背景 → 软件阴影卡片 → GPU 前景图标
```

不能被错误压缩成：

```text
全部 GPU → 全部软件
```

## 3. 计划结构

`vsr.hybrid-render-plan.v0.1` 包含：

- Source Display Hash；
- 连续 Layer；
- 每层 itemId、起止序号和 Layer Hash；
- GPU 层的 WebGPU Plan；
- GPU 覆盖率；
- 完整顺序验证结果。

## 4. GPU 资源

- 字体：冻结位图 → 图集 → UV；
- 图片：RGBA 纹理 → fit/crop UV；
- Path：固定采样 → Ear Clipping；
- 纯色几何：统一顶点格式；
- 纹理采样：nearest / linear 显式记录。

## 5. Fail-closed

以下语义不会被静默近似：

- even-odd Path；
- Path 描边；
- 阴影；
- Clip Stack；
- 虚线；
- 特殊混合模式；
- 未提供冻结字体的文字；
- 未加载的图片资源。

它们进入软件层，并保留原显示顺序。
