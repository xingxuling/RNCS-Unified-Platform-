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
- Metallic / Roughness 紧凑参考光照；
- Directional / Point / Ambient Light；
- Directional Shadow Map 参考路径；
- CPU Depth Buffer 参考渲染；
- WebGPU WGSL 和资源 / Pass 计划；
- Reality Root、Geometry Root、Material Root、Command Root、Frame Root。

它是三维真实性基线，不是完整商业 PBR、glTF 资产管线或生产级 GPU 渲染器。
