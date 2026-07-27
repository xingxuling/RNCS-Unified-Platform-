# Spatial Reality 3D v0.4

VSR 的首个三维空间现实参考层。它把 Mesh、层级变换、相机、材质、灯光、深度、阴影、LOD 和证据根编译成确定性的 `vsr.spatial-frame-plan.v0.4`。

当前包含：

- Indexed triangle mesh；
- 自动法线；
- Cube / Plane / UV Sphere 原语；
- Perspective / Orthographic Camera；
- 层级 Transform；
- Frustum Culling；
- Distance LOD；
- 确定性 World Partition：按观察者位置加载/卸载 cell，支持跨帧滞后、强制驻留、常驻节点和 streaming root；
- 确定性静态实例合批，CPU 逐实例参考路径与 WebGPU `instance_index` 路径；
- 可选 GPU-driven culling：compute pass 写 visible indices 和 `drawIndexedIndirect` 参数；
- `VSRSpatialAssetStreamer`：依赖优先异步加载、并发上限、字节 SHA-256 校验、驻留状态和收据根；帧计划可选绑定 `assetStreaming` 证据；
- Metallic / Roughness 紧凑参考光照；
- Directional / Point / Ambient Light；
- Directional Shadow Map 参考路径；
- CPU Depth Buffer 参考渲染；
- WebGPU WGSL 和资源 / Pass 计划；
- Reality Root、Geometry Root、Material Root、Command Root、Frame Root。

相同 Mesh、Material、LOD、阴影标志和变形根的可见节点会合并到一个 instanced draw packet。每个实例仍保留自己的节点标识、世界矩阵、包围盒和距离证据；旧的单节点 packet 也能被验证和回放。World Partition 以 cell 的中心、半径和节点清单定义加载边界；跨帧把上一帧活动 cell 传回编译器即可得到 `enteredCellIds` / `exitedCellIds`，并由 `streaming.root` 和 `frameRoot` 封存。`gpuDrivenCulling` 默认关闭；开启后，CPU 只编译候选实例，WebGPU compute pass 按场景相机和独立的 shadow light-space camera 写 visible-index 与 indirect args，场景与阴影 pass 都通过 `drawIndexedIndirect` 执行。fake WebGPU 编码链已覆盖两条通道；真实设备像素、驱动兼容性和性能仍需浏览器 GPU 验收。当前范围仍不包含跨材质合批、磁盘异步资产调度或完整商业 PBR。

它是三维真实性基线，不是完整商业 PBR、glTF 资产管线或生产级 GPU 渲染器。资产流模块只定义确定性的加载与证据边界；实际 fetch、磁盘缓存、GPU 上传和设备兼容性仍需宿主执行器验收。
