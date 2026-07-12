# VSR Realtime WebGPU Executor v0.3

将 VSR v0.2 的观察者相对 Visual Reality Plan 编译为可在浏览器 WebGPU 上执行的实时帧计划。

核心能力：

- 持久化 WebGPU Device / Pipeline Cache
- 单纹理图集与 UV 重映射
- 连续兼容绘制包合并
- Compute Tiled Light Culling
- GPU Particle Simulation / Instanced Render
- Scene Offscreen Pass + Bloom / Tone Mapping / Vignette
- Evidence-bound Frame Receipt
- WebGPU 不可用时显式降级，不伪装执行成功
