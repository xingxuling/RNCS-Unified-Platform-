# Reality Studio v1.0.0-alpha.1 发布说明

## 版本主题

**实时 GPU 制造版**

v1.0 把 Reality Studio v0.9 的统一制造会话与 VSR v0.3 的实时视觉执行结构正式合并。编辑器中的场景、资产和行为状态能够编译为观察者相对的 GPU Frame Plan，并交给 WebGPU 执行器或明确的 Canvas 参考后端。

## 主要新增

- Studio 场景与行为状态转换为 VSR DisplayState。
- Economy / Balanced / Quality / Cinematic GPU 预算。
- WebGPU 纹理图集、绘制批、Compute 灯光筛选、GPU 粒子、后处理。
- GPU 设备丢失检测与 Canvas Reference 降级。
- Frame Plan Root、Resource Root、Command Root 与视觉证据绑定。
- Reality Studio GPU Viewport Manifest。
- Reality Build GPU Requirement。
- 实时 GPU 面板、质量切换和编译/执行回执。

## 真实边界

当前交付包含真实 WebGPU 执行器源码和可运行浏览器路径，但交付容器本身没有 WebGPU Adapter，因此不能据此报告真实显卡 FPS。Canvas 降级路径、帧计划传输和前端状态机已经在 Chromium 中验证。
