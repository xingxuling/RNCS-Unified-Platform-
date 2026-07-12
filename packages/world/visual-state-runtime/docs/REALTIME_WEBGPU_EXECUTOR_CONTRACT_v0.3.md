# VSR Realtime WebGPU Executor Contract v0.3

## 输入

- `VSRDisplayState`
- `VSRVisualRealityConfig`
- Raster Resources
- 可选编译预算

## 输出

`VSRRealtimeGPUFramePlan`：

- `sourceDisplayHash`
- `visualPlanRoot`
- `visualEvidenceRoot`
- Texture Atlas
- Remapped Vertex Buffer
- Draw Packets
- Light Storage Buffer
- Tile Light Buffer
- Particle Storage Buffer
- Render Graph Passes
- WGSL Modules
- Resource / Command / Frame Roots

## 执行顺序

```text
upload
→ light-cull compute
→ particle-sim compute
→ scene render
→ particle render
→ postprocess
→ evidence receipt
```

## WebGPU 运行时约束

- 必须在安全上下文或 localhost 中运行；
- 必须存在 `navigator.gpu`；
- 必须取得 Adapter、Device 和 WebGPU Canvas Context；
- Device Lost 后不得继续声明提交成功；
- Pipeline 和 GPU 资源应跨帧缓存；
- 动态 Buffer 在容量允许时复用并增量写入；
- GPU 不可用时返回明确的 Canvas Reference 降级信息。

## 证据

`Frame Receipt` 至少绑定：

- Source Display Hash
- Frame Plan Root
- Resource Root
- Command Root
- Frame Index
- 执行模式
- Draw / Compute 数量
- Device Lost 状态
- 编译、上传、编码、提交耗时
