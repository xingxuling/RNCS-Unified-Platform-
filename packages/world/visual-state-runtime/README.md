# Visual State Runtime（VSR）v0.8.0-alpha.1

VSR是RNCS的独立视觉时间投影、三维资产和可验证像素执行层。

## v0.8 Complete PBR Projection

- glTF Base Color、Metallic-Roughness、Normal、Occlusion、Emissive纹理映射。
- Nearest与Bilinear采样。
- 切线空间Normal Map。
- Alpha Mask在深度写入前裁剪。
- 默认透明路径使用 weighted-blended OIT：独立 accumulation/revealage 目标、深度测试不写深度、resolve composite 与 CPU 参考路径共享同一权重和透过率契约；`transparencyMode:'sorted'` 保留兼容路径。
- 七类纹理绑定进入Import Receipt、Draw Packet、Material Root、Texture Root和Frame Root。
- 材质与动画只改变Presentation Root，不改写Authority Root。
- 浏览器WebGPU三维执行器已接入七路材质纹理Bind Group和方向光GPU Shadow Map depth pass。
- WebGPU Frame Receipt记录材质纹理绑定数与shadow pass数；设备无关fake-device验收覆盖完整编码链。
- WebGPU与CPU参考路径已接入四影响骨骼蒙皮和最多四个Morph Target；glTF JOINTS_0、WEIGHTS_0、skins与targets/POSITION可直接导入。
- 动画采样保留glTF原生四元数，支持最短弧SLERP、STEP、LINEAR和CUBICSPLINE Hermite关键帧；旋转不再先降成欧拉角。
- 编译选项支持确定性动画图状态、状态过渡、Override/Additive图层和显式node mask；混合结果进入Animation Root与Frame Root。
- 变形状态进入Draw Packet、Geometry Root、joint/morph GPU resource root和Frame Root。
- 新增 `compileSpatialFrameFromVisualIntent()`，消费 RCL `taowind.rcl-rncs-visual-intent.v0.1`，验证 intent root 后把动画选择、节点遮罩、look-at/two-bone IK、skin/morph 变形和 visual intent root 纳入帧计划。
- `animationConstraints` 支持确定性 `look-at` 与 `two-bone-ik`；约束在动画图/图层采样之后解算，结果进入 Animation Root、Draw Packet 与 Frame Root。
- 新增确定性环境光照项：diffuse/specular environment colors 与 intensity 同时进入 CPU 参考路径、WebGPU Camera uniform、Environment Root 和 Frame Root；这是统一环境光照，不冒称图像探针 IBL。
- `environment.textureId` 接入 RGBA equirectangular 环境纹理；CPU 与 WebGPU 使用相同方向到经纬度 UV 和 roughness lobe 混合，纹理采样进入 Environment Root、Texture Root 和 Frame Root。
- 屏幕空间后处理新增有界动态间接光照（SSGI）：CPU参考路径与WebGPU tone-map共享深度差、颜色采样、半径、步数和厚度契约；真实 Chromium receipt 记录 `ssgiPasses=1`。这是局部屏幕空间反弹，不冒称完整 DDGI/Lumen。
- 新增确定性 irradiance probe bake：从场景灯光、环境和 emissive 几何生成带 `sourceRoot`/`root` 的最多八个 probe，写回现有 `environment-probes` CPU/WebGPU 路径；真实 Chromium receipt 记录 `irradianceCacheProbes`。这是有界 probe cache，不冒称完整 DDGI。
- 新增确定性静态 lightmap bake v0.2：对无 skin、无 morph、无 LOD 的静态节点生成受预算约束的 triangle charts，使用最多四个固定采样点对 opaque/masked 几何做真实射线可见性判断，并将已覆盖 texel 按 dilation 扩张到 padding；结果写入独立 UV1、线性 atlas、节点材质绑定和 `lightmapBakeRoot`，CPU 与 WebGPU 直接消费同一 bake 结果，`evidence:lightmap-bake` 可回读验证并生成 PNG。它仍不是工业级 seam/pack 优化、完整漏光治理或动态 GI。
- 新增 `vsr.spatial-irradiance-volume.v0.1`：在有界 2..16、总样本不超过 512 的三线性网格中持久化环境/灯光/emissive irradiance，带 `sourceRoot`、`topologyRoot`、可见性采样、增量 `updateAlpha` 和动态光照更新；CPU PBR 与 WebGPU binding 8 消费同一 volume，receipt 记录 `irradianceVolumeSamples`。`evidence:irradiance-volume` 会回读 JSON、校验 root 并生成 CPU PNG；这是有界动态缓存，不冒称完整 DDGI/Lumen。
- 新增 `vsr.spatial-irradiance-volume-field.v0.1`：在同一 source/topology root 下组织最多八个 irradiance volumes，按 world-partition cell 做确定性 active-cell 选区、AABB blend 和总样本预算裁剪；CPU 三线性采样与 WebGPU binding 8 共享多体积布局，`evidence:irradiance-volume-field` 会回读 field JSON、验证选区 root 并生成 CPU PNG。这是有界多体积 field，不冒称完整 DDGI/Lumen、跨体积漏光治理或生产级大世界 GI。
- 新增有界 authored reactive mask：材质 `temporalReactive`、`reactiveMaskTextureId`、节点 reactive 标量和 skin/morph 保守覆盖进入 Draw Packet、CPU reference、WebGPU reactive attachment、OIT composite 与 temporal resolve；材质 mask 在真实 Chromium 中以独立纹理绑定执行。
- 新增有界 motion-vector temporal resolve：Draw Packet 保存当前/上一实例变换，CPU 与 WebGPU 共享 velocity attachment、OIT velocity resolve、velocity dilation、previous-depth/history-velocity reject；真实 Chromium 覆盖静止与运动对象帧。

## 运行

```bash
npm run typecheck
npm run test:spatial-3d
npm run test:gltf
npm run evidence:irradiance-bake
npm run evidence:lightmap-bake
npm run evidence:irradiance-volume
npm run evidence:irradiance-volume-field
npm test
```

`evidence:irradiance-bake`、`evidence:lightmap-bake`、`evidence:irradiance-volume` 和 `evidence:irradiance-volume-field` 会分别生成并回读 bake/field JSON，同时写出 `evidence.json` 与 CPU 参考 `reference.png`。

## 真实性边界

- CPU参考光栅、fake WebGPU设备编码链和真实 Chromium WebGPU 已验证完整PBR纹理、GPU Shadow Map、透明 OIT pass 与设备提交边界；当前不声称目标硬件实机帧率。
- 压缩图像解码仍由宿主资产管线提供RGBA。
- 环境 mip、局部 irradiance/reflection probe 混合、确定性 probe bake、有界单体积/多体积 irradiance field 与 cell 选区混合、带有界几何可见性与 atlas dilation 的静态 lightmap/UV1 bake、有界 velocity-aware temporal reprojection、亮度与作者/材质/变形驱动 reactive history 抑制和有界 SSGI 已接入；工业级 chart packing、跨体积漏光/遮挡治理、DDGI/Lumen 动态 GI、服务器级世界分区仍未完成。
- 当前透明路径是 weighted-blended OIT；精确 per-pixel linked-list OIT、高阶 disocclusion/TAA history heuristics、XR 双目和目标硬件性能仍未完成。
- GameBrain/RCL 的视觉意图接入是受控帧编译输入，不等于外部世界提交；权威提交仍由 RNCS 控制平面和人工授权负责。
