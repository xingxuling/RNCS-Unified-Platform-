# Visual Reality Compiler Contract v0.2

## 1. 权威边界

- `VSRDisplayState` 是视觉来源状态。
- Visual Reality Plan 是投影执行候选，不是新的现实提交。
- 材质、灯光、后处理和预算不能修改 `sourceDisplayHash`。
- 所有设备计划绑定同一个 `sourceRealityHash`。

## 2. 可见性

每个 DisplayItem 必须产生一条记录：

- `visible`
- `viewport-culled`
- `occluded`
- `lod-degraded`

LOD 只允许作用于标记为 `decorative` 或 `particle` 的对象。文字与普通语义对象不会因面积过小被静默删除。

## 3. 批处理

只合并连续、材质/类型/混合/裁剪一致的项目。禁止跨越不同层级项目重排，以免改变遮挡意义。

## 4. 光照与预算

质量档位：

- economy
- balanced
- quality
- cinematic

预算控制灯光上限、阴影灯上限、粒子预算、Render Scale、Bloom、Light Tile 和 LOD 阈值。预算变化必须进入 Plan Root。

## 5. Render Graph

固定语义 Pass：

```text
Projection
→ Visibility
→ Shadow
→ Opaque
→ Lighting
→ Transparent
→ Emissive / Particles
→ Postprocess
→ Composite
→ Evidence
```

被禁用的 Pass 必须保留原因，不能静默伪造结果。

## 6. 感知等价

两个计划可以像素不同，但必须满足：

- 来源现实根相同；
- 非装饰语义项目均保留；
- 差异仅来自声明的装饰性降级；
- 等价报告具有独立根。

## 7. 后端

- CPU 参考渲染用于确定性与像素证据。
- WebGPU Plan 用于 GPU 资源与 Draw Command 编译。
- Hybrid Plan 保持 GPU / 软件层的原始顺序。
- CPU 性能不得宣称为 GPU 实时性能。
