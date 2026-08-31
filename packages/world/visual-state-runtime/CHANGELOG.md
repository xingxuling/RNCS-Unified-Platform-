# Changelog

## Unreleased

- Spatial temporal frame plans now carry bounded `temporalVelocityThreshold`/`temporalVelocityDilation` controls and current/previous instance transforms; CPU and WebGPU paths pack and consume the same 128-byte-per-instance transform contract.
- Spatial temporal resolve now carries motion-vector velocity attachments through opaque, transparent, weighted-OIT, and history paths, applies bounded velocity dilation plus previous-depth/history-velocity rejection, and records `velocityPasses`; real Chromium coverage now includes static and moving-object frames across thirteen submitted, device-loss-free frames.
- Added deterministic environment mip-chain generation, roughness-aware CPU IBL sampling, WebGPU mip uploads, and explicit environment mip evidence in spatial frame plans;
- WebGPU spatial execution now renders into an HDR `rgba16float` scene target and executes the declared full-screen tone-map pass before presenting to the canvas;
- glTF import now supports normalized and sparse accessors, node matrices, and an explicit host image-decoder resolver for encoded external images;
- glTF skin import now transposes inverse-bind MAT4 accessors from glTF column-major storage into the VSR row-major transform contract, preserving RAGF rig geometry during CPU/GPU deformation;
- glTF asset import now parses GLB v2 JSON/BIN chunks and seals the binary payload into the imported scene root; `parseGlb` and `importGlbToSpatialScene` are exported for host integrations;
- glTF import now exposes async embedded/external image bytes, a browser `createImageBitmap` decoder, and a `VSRGltfAsset` browser bundle so PNG/JPEG/WebP pixels can enter the RGBA texture contract instead of remaining a warning;
- glTF texture import now resolves `KHR_texture_basisu` and `EXT_texture_webp` alternative image sources before standard `texture.source` for both synchronous imports and asynchronous host decoding; actual KTX2/BasisU transcoding remains outside the runtime;
- glTF image decoding now parses native KTX2 RGBA8 UNORM/SRGB mip containers and routes `image/ktx2` through the host decoder without browser bitmap APIs; BasisU supercompression remains an explicit transcoder boundary;
- glTF material import now maps `KHR_materials_clearcoat`, `KHR_materials_ior`, and `KHR_materials_emissive_strength` scalar extensions into VSR's clearcoat, IOR, and emissive-strength PBR channels;
- WebGPU spatial shading now consumes a bounded 48-byte-per-light storage buffer for directional and point lights, with range attenuation and directional shadow visibility included in the PBR fragment path;
- Spatial frame plans now carry a rooted post-process contract for exposure, contrast, saturation, and vignette; CPU reference and WebGPU tone-map execution consume the same clamped values;
- Spatial post-processing now includes rooted HDR bloom threshold, intensity, and radius controls; CPU reference and WebGPU tone-map execution share the same bright-pass sampling contract;
- Spatial post-processing now reads a sampleable depth32float scene target and applies rooted depth-of-field focus, range, intensity, and radius controls before tone mapping;
- Spatial environment lighting now accepts up to eight rooted local irradiance/reflection probes, shared by CPU PBR shading and the WebGPU storage-lighting path;
- Spatial post-processing now carries bounded temporal history accumulation and motion-vector reprojection: CPU reference blending, WebGPU rgba16float history/velocity copy and sampling, explicit resize/reset invalidation, and temporal roots; higher-order TAA history heuristics remain outside the contract;
- Spatial WebGPU texture resources now use explicit quality-tier byte budgets, last-use LRU eviction after submitted work, and receipt-level upload/eviction/resident-byte evidence;
- Spatial WebGPU mesh/material/object/instance/deformation/culling buffers now share explicit quality-tier byte budgets with last-use LRU eviction, cache invalidation, and receipt-level upload/eviction/resident-byte evidence;
- Spatial materials now execute sorted alpha blending and alpha masking end to end: CPU transparent packets sort back-to-front without depth writes, mask fragments discard before depth writes, and WebGPU uses a dedicated source-alpha blend pipeline;
- Spatial transparency now defaults to weighted-blended OIT for BLEND materials: rooted accumulation/revealage resources, depth-tested non-writing transparent passes, full-screen resolve composite, CPU order-independent reference composition, and `transparencyMode:'sorted'` compatibility fallback are all covered by frame-plan and real Chromium WebGPU evidence;
- Spatial temporal history now stores previous-frame depth, velocity, and view-projection state; CPU and WebGPU tone-map execution reprojects history through current inverse projection, previous view projection, and per-instance previous transforms, rejects projected-depth/history-velocity disagreement, and clamps history against a bounded 3x3 current-frame neighborhood; higher-order disocclusion heuristics remain future work;
- Spatial temporal resolve now includes bounded luminance-derived, authored/material, and conservative skin/morph reactive coverage shared by CPU and WebGPU; the default strength is zero, bright history can be suppressed deterministically, and the 96-byte uniform plus dedicated reactive attachment are rooted in frame evidence;
- Spatial draw packets now root material `temporalReactive`, `reactiveMaskTextureId`, node reactive scalars, and conservative deformation coverage; WebGPU carries the mask through a dedicated HDR attachment, weighted OIT composite, and tone-map resolve;
- Spatial post-processing now includes a bounded eight-tap depth-backed SSAO/contact-occlusion term shared by CPU reference and WebGPU tone-map execution; full dynamic GI remains outside this local screen-space contract;
- Spatial post-processing now includes bounded screen-space dynamic indirect light: CPU reference and WebGPU tone-map execution share depth/color sampling, radius, step, and thickness controls, and the WebGPU receipt exposes `ssgiPasses`; this is not full DDGI/Lumen dynamic GI;
- Spatial lighting now includes a deterministic irradiance probe bake artifact with source/root verification; generated probes are applied to the existing CPU/WebGPU environment-probe buffer and the receipt exposes `irradianceCacheProbes`; this remains a bounded probe cache, not full DDGI;
- Spatial lighting now includes `vsr.spatial-irradiance-volume.v0.1`: a rooted, bounded trilinear irradiance grid with static-geometry visibility samples, topology/source separation, incremental light-update blending, shared CPU/WebGPU sampling through binding 8, and `irradianceVolumeSamples` receipt evidence; this remains a bounded dynamic cache, not full DDGI/Lumen;
- Spatial lighting now includes `vsr.spatial-irradiance-volume-field.v0.1`: up to eight rooted volumes share source/topology identity, streaming cell selection, bounded AABB blending, and a shared multi-volume CPU/WebGPU binding-8 layout; full DDGI/Lumen and cross-volume leakage/occlusion control remain outside the contract;
- Added `evidence:irradiance-bake` to persist a JSON bake, re-read and verify its root, apply it to the showcase scene, and emit a CPU reference PNG plus evidence summary;
- Added `evidence:irradiance-volume-field` to persist and re-read a two-volume field, verify active-cell roots, apply it to the showcase scene, and emit a CPU reference PNG plus evidence summary;
- Added deterministic static lightmap baking v0.2 with bounded triangle-chart UV1 generation, up to four fixed geometric visibility samples for shadow-casting opaque/masked occluders, deterministic atlas-edge dilation, per-node baked mesh/material bindings, linear atlas output, source/root verification, and `evidence:lightmap-bake`; industrial chart packing, full leakage control and dynamic GI remain outside this contract;
- Spatial materials now accept a rooted linear baked-lightmap texture through CPU PBR sampling and the WebGPU material bind group; secondary-UV generation, baking, and dynamic GI remain outside this input contract;
- Spatial mesh import and execution now preserve glTF `TEXCOORD_1` as `uvs1`, pack it through CPU/WebGPU vertex paths, and let baked lightmaps select the independent UV set;
- `networkPacketToTemporalState` 新增 RSR v0.7 权威帧适配，时序对象保留 `bodyRoot`、grounded/awake/enabled 和 tags；
- 新增 `authoritativeFrameToTemporalState` 强类型入口，并为时序包保留独立 VSR SHA-256 packet root，显式指向 RSR frame root；
- WebGPU三维执行器接入七路材质纹理Bind Group与方向光GPU Shadow Map depth pass；
- 新增空间 WebGPU adapter capability contract：`evaluateSpatialWebGPUCapabilities` / `inspectSpatialWebGPU` 收集 adapter 名称、features、limits，拒绝缺失的 required features/limits，并将设备丢失原因写入 WebGPU receipt；
- 新增四影响骨骼蒙皮、最多四个Morph Target，以及对应的CPU参考、GPU storage buffer和Frame Root证据；
- glTF导入器接入JOINTS_0、WEIGHTS_0、skins与targets/POSITION，并扩展导入收据统计；
- 动画采样保留glTF四元数，新增最短弧SLERP、CUBICSPLINE Hermite采样与动画场景Schema证据；
- 新增确定性动画图状态过渡、Override/Additive图层与显式骨骼遮罩，并将混合姿态绑定到Frame Root；
- 新增 RCL RNCS Visual Intent v0.1 consumer，验证 content root 后统一编译 clip、layers、graph、node mask、look-at/two-bone IK constraints 与 skin/morph deformation；
- 新增确定性环境光照颜色项，统一 CPU 参考渲染与 WebGPU Camera uniform，并将 Environment Root 纳入 Command/Frame Root；图像探针 IBL 与 GI 仍保留为后续边界；
- `environment.textureId` 接入 RGBA equirectangular 环境纹理；新增 CPU/WebGPU 方向采样、基础 roughness lobe 混合和环境纹理 bind group 证据；预过滤 mip、探针混合和 GI 仍未完成；
- 新增确定性静态实例合批与 World Partition streaming；CPU 参考渲染逐实例保真，WebGPU scene/shadow pass 使用 instance matrix storage buffer 与 `instanceCount`，并把可见实例、实例 draw、streaming root 和 instance buffer 纳入帧证据；
- 新增默认关闭的 `gpuDrivenCulling`：显式共享 compute bind group layout，compute pass 按实例 bounds 写 visible-index 与 indirect args，scene pass 使用 `drawIndexedIndirect`；fake WebGPU 编码链已验收，真实硬件像素、驱动兼容与性能仍需浏览器 GPU 验收；
- 扩展 `gpuDrivenCulling` 到方向光 Shadow Pass：为场景相机与 light-space 相机维护独立的 visible/counter/indirect buffers，阴影深度绘制也使用 `drawIndexedIndirect`，并在 WebGPU receipt 中记录 `gpuDrivenShadowDraws`；真实设备像素、驱动兼容与性能仍需浏览器 GPU 验收；
- 新增 `vsr.spatial-asset-streaming.v0.1`：资产 catalog、依赖优先异步加载、并发预算、字节 SHA-256 校验、驻留/失败/阻断状态和收据根；空间帧计划可绑定 `assetStreaming`；真实网络、磁盘缓存和 GPU 上传执行器仍需平台验收；

## 0.4.0-alpha.1

- 新增三维空间现实场景与帧计划v0.4；
- 新增Indexed Mesh、Cube、Plane、UV Sphere与自动法线；
- 新增父子层级变换、透视/正交相机；
- 新增视锥裁剪、距离LOD与灯光预算；
- 新增深度缓冲CPU确定性参考光栅器；
- 新增金属度—粗糙度参考材质与三维灯光；
- 新增方向光阴影参考路径和Shadow Pass计划；
- 新增WebGPU顶点、索引、相机、对象和材质资源打包；
- 新增浏览器WebGPU三维执行类与Frame Receipt；
- 新增Geometry、Material、Command、Frame和Pixel证据根；
- 新增三维CLI、浏览器演示、Schema、基准与发布审计；
- 全量测试由120项提升至153项。

## 0.3.0-alpha.1

- 新增 Realtime WebGPU Frame Plan v0.3；
- 新增 Texture Atlas 与 UV 重映射；
- 新增连续兼容 Draw Packet 合并；
- 新增 Compute Tiled Light Culling WGSL；
- 新增 GPU Particle Compute / Instanced Render WGSL；
- 新增 Offscreen Scene 与 Postprocess Pass；
- 新增持久化 Pipeline、Atlas 和动态 Buffer 缓存；
- 新增 Device Lost 边界与 Frame Receipt；
- 新增 Reality Studio v0.9 和 Reality Build Fabric 适配清单；
- 新增 CLI `realtime-gpu-plan`；
- 新增浏览器演示与 Canvas Reference 显式降级；
- 新增 SHA-256 字节流实现，显著降低大缓冲证据计算开销；
- 全量测试从 95 项提升到 120 项。

## 0.2.0-alpha.1

- 观察者相对 Visual Reality Compiler；
- 材质、灯光、批处理、Render Graph 与 CPU Reference。
