# Changelog

## Unreleased

- WebGPU三维执行器接入五路材质纹理Bind Group与方向光GPU Shadow Map depth pass；
- 新增四影响骨骼蒙皮、最多四个Morph Target，以及对应的CPU参考、GPU storage buffer和Frame Root证据；
- glTF导入器接入JOINTS_0、WEIGHTS_0、skins与targets/POSITION，并扩展导入收据统计；
- 动画采样保留glTF四元数，新增最短弧SLERP、CUBICSPLINE Hermite采样与动画场景Schema证据；

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
