# VSR Realtime WebGPU Executor Contract v0.3

## 输入

- `VSRDisplayState`
- `VSRVisualRealityConfig`
- Raster Resources
- 可选编译预算
- 可选运行时状态：`tick`、`stateRoot`、实体变量和活动状态

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
- Dynamic Entity Vertex Bindings
- Dynamic Light Bindings

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

## 动态状态协议

`compileRealtimeWebGPUFrame` 负责构建稳定的资源与命令计划；`createRealtimeWebGPUFrame` 在行为 Tick 后消费权威实体状态，复制并更新动态顶点与灯光 buffer，然后重新封存 `sourceDisplayHash`、`resourceRoot` 和 `framePlanRoot`。绑定必须引用已编译的顶点范围或灯光 ID，不能改变 Draw Packet、Pass、Shader 或材质资源的结构。

运行时状态只允许通过宿主提供的实体变量进入视觉帧。浏览器执行器不得反向改写行为状态；碰撞、导航、胜负和因果状态仍由 RNCS/RSR 权威运行时决定。

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
