# VSR v0.3 Realtime WebGPU API

## 编译帧计划

```ts
const frame = compileRealtimeWebGPUFrame(displayState, visualConfig, resources);
const verification = verifyRealtimeWebGPUFrame(frame);
```

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
