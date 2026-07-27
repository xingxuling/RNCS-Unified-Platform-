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
- 确定性静态实例合批，CPU 逐实例参考路径与 WebGPU `instance_index` 路径；
- Metallic / Roughness 紧凑参考光照；
- Directional / Point / Ambient Light；
- Directional Shadow Map 参考路径；
- CPU Depth Buffer 参考渲染；
- WebGPU WGSL 和资源 / Pass 计划；
- Reality Root、Geometry Root、Material Root、Command Root、Frame Root。

相同 Mesh、Material、LOD、阴影标志和变形根的可见节点会合并到一个 instanced draw packet。每个实例仍保留自己的节点标识、世界矩阵、包围盒和距离证据；旧的单节点 packet 也能被验证和回放。当前范围是静态/相同变形状态实例，不包含 GPU-driven indirect draw、跨材质合批或流式世界分区。

它是三维真实性基线，不是完整商业 PBR、glTF 资产管线或生产级 GPU 渲染器。
