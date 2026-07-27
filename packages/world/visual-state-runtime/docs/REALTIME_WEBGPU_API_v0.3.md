# VSR v0.3 Realtime WebGPU API

## 编译帧计划

```ts
const frame = compileRealtimeWebGPUFrame(displayState, visualConfig, resources);
const verification = verifyRealtimeWebGPUFrame(frame);
```

## 行为 Tick 的动态帧

构建阶段的 `VSRRealtimeGPUFramePlan` 同时携带实体顶点范围和动态灯光绑定。浏览器宿主在每个行为 Tick 后用当前权威状态生成可执行帧，并重新计算资源根与帧计划根：

```ts
const frame = createRealtimeWebGPUFrame(buildFrame, {
  tick: behaviorState.tick,
  stateRoot: behaviorStateRoot,
  entities: behaviorState.entities,
});
const verification = verifyRealtimeWebGPUFrame(frame);
```

`dynamicBindings` 将实体的 `x/y` 变量映射到 GPU 顶点范围，`dynamicLightBindings` 将实体位置映射到对应灯光记录。不可见、死亡或已收集实体会将绑定范围的 alpha 置零。这个更新只重写动态 buffer，不重新编译材质、图集、Draw Packet、Pass 或 WGSL；没有可用 WebGPU 时仍由 Canvas Reference 路径负责显示。

## 创建执行器

```ts
const executor = await VSRRealtimeWebGPUExecutor.create(canvas, {
  powerPreference: 'high-performance',
  alphaMode: 'premultiplied',
});
```

## 提交帧

```ts
const receipt = await executor.render(frame, elapsedSeconds);
```

## 能力探测

```ts
const capabilities = probeRealtimeWebGPU();
```

## Studio 与发布接入

```ts
const viewport = compileRealityStudioGPUViewport(project, frame);
const requirement = compileRealityBuildGPURequirement(projectRoot, frame);
```

## CLI

```bash
node dist/packages/cli/src/cli.js realtime-gpu-plan \
  examples/visual-reality-showcase.vsr.json \
  examples/visual-reality-showcase.config.json \
  --time 0 \
  --out outputs/frame-plan.json
```
