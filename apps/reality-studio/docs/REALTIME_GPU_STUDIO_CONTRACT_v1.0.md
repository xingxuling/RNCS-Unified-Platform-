# Reality Studio 实时 GPU 制造合约 v1.0

## 1. 输入

- 有效的 `reality-studio.unified-project.v0.9` 项目；
- 当前场景投影；
- Behavior Runtime 状态；
- Observer：player / debugger / auditor / accessibility；
- Quality：economy / balanced / quality / cinematic；
- GPU Tier：0–3。

## 2. 编译结果

必须生成：

- VSR DisplayState；
- VSR Visual Reality Plan；
- VSR Realtime WebGPU Frame；
- GPU Frame Summary；
- GPU Viewport Manifest。

## 3. 不变量

1. 相同项目、相同行为状态和相同预算必须得到相同 Frame Plan Root。
2. 行为状态变化必须改变 Source Display Hash，并在视觉相关时改变 Frame Plan Root。
3. 质量档可以改变执行预算，不得改变关键主体、任务目标和交互语义。
4. WebGPU 不可用时必须报告 Canvas Reference，不得伪装为 GPU 成功。
5. Frame Plan 必须绑定 Visual Plan Root、Visual Evidence Root、Resource Root 和 Command Root。
6. 导出 GPU Manifest 必须绑定统一项目根。

## 4. 执行器责任

- 探测 Adapter、Device、Canvas Context；
- 构建并缓存 Pipeline、Buffer、Texture；
- 上传 Atlas 和动态状态；
- 执行 Light Cull、Particle Compute、Scene、Particle、Postprocess；
- 捕获 Device Lost；
- 输出执行回执或明确降级原因。

## 5. 非目标

v1.0 不承诺：

- 在没有物理 WebGPU Adapter 的环境报告真实 FPS；
- 完整 3D PBR、GI、大世界或主机平台渲染；
- 取代驱动级 GPU 调试器。
