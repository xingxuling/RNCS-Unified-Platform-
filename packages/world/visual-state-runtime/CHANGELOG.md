# Changelog

## Unreleased

- WebGPU三维执行器接入五路材质纹理Bind Group与方向光GPU Shadow Map depth pass；
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
