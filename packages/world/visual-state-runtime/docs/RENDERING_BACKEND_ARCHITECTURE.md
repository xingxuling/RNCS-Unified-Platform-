# VSR alpha.9 渲染后端架构

## 1. 目标

VSR 的权威对象不是 PNG 或 Canvas，而是确定性的 `DisplayState`。后端只能投影该状态，不能偷偷修改现实语义。

```text
Visual IR
→ Core Evaluation
→ DisplayState
├─ Software Raster Backend
├─ WebGPU Plan Compiler
└─ Null / Future Native Backend
```

## 2. 软件快速路径

旧实现即使面对轴对齐纯色矩形，也会为每个像素执行逆矩阵变换和通用形状判断。alpha.9 增加：

- 轴对齐识别；
- 裁剪区域求交；
- 不透明纯色整行复制；
- 圆角矩形扫描线；
- 可配置 PNG 压缩等级。

复杂仿射、Path、图片和其他情况仍进入原通用路径，保证能力不因优化被删除。

## 3. WebGPU Plan

`compileWebGPUPlan` 把可支持节点转换为固定步幅顶点数据：

```text
position.xy + uv.xy + color.rgba + shape/radius.xyz
```

当前直接支持：

- 纯色矩形；
- 纯色圆角矩形；
- 纯色椭圆；
- 纯色实线。

当前明确回退：

- 文字；
- 图片；
- Path；
- 裁剪栈；
- 矩形／椭圆描边；
- 阴影；
- 虚线；
- 非默认混合模式；
- 非纯色 Paint。

“回退”不是失败，而是防止 GPU 后端静默改变视觉含义。

## 4. 哈希边界

- `planHash` 与 `gpu32` 用于缓存、重复计划识别和调试；
- 权威证据仍使用规范化 SHA-256；
- 轻量计划指纹不得替代 RFE Evidence 或共享现实提交根。

## 5. 浏览器执行

`renderDisplayStateWebGPU`：

1. 编译计划；
2. 若存在回退节点则拒绝“全 GPU”执行；
3. 请求 `navigator.gpu` adapter/device；
4. 创建 WGSL 管线与顶点缓冲；
5. 提交 triangle-list draw。

Node 环境仅验证计划编译，不伪造 GPU 设备或帧时间。

## 6. 字体冻结

字体冻结管线把用户本地字体中的必要字符转换为固定尺寸二值位图：

```text
本地 TTF/OTF/TTC
→ 字符集合
→ Pillow 光栅
→ 固定宽高位图
→ 字形集合哈希
→ Node 确定性渲染
```

发布包不包含源字体或冻结字体数据。工具输出属于使用者本地资产。

## 7. 下一阶段

优先顺序：纹理与文字图集 → Path tessellation → 混合后端合成 → 批次与缓存 → 浏览器真机像素等价。
