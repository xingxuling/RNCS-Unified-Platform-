# Reality Studio v1.0 实时 GPU API

## Node API

### `sceneProjectionToVSRDisplayState(project, projection, options)`

把 Studio 的场景/行为投影转换为 VSR DisplayState。

### `compileStudioGPUFrame(project, projection, options)`

返回：

```js
{
  frame,        // VSR v0.3 typed-array frame
  serialized,   // JSON transport frame
  summary,      // roots, viewport, stats, passes
  manifest,     // Studio GPU viewport manifest
  compile_ms
}
```

### `UnifiedManufacturingSession.compileGPUFrame(options)`

使用当前权威行为状态编译帧，并记录最近一次 GPU 编译指标。

### `UnifiedManufacturingSession.setGPUOptions(options)`

更新 quality、observer、gpu_tier 和 enabled。

## HTTP API

### `POST /api/unified/session/gpu-frame`

请求：

```json
{
  "session_id": "...",
  "quality": "quality",
  "observer": "player",
  "gpu_tier": 2
}
```

响应：GPU Frame Summary、Viewport Manifest、序列化 VSR Frame 和编译耗时。

### `POST /api/unified/session/command`

新增命令：

```json
{
  "command": "gpu-options",
  "payload": {"quality":"cinematic"}
}
```

## CLI

```bash
node src/cli.mjs gpu-frame \
  --project examples/冰境试炼.unified-project.json \
  --quality quality \
  --out output/gpu-frame.json
```

## 浏览器 API

```js
const viewport = new RealityGPUViewport(gpuCanvas, fallbackCanvas)
const receipt = await viewport.render(serializedFrame, timeSeconds)
```

回执模式：

- `webgpu`
- `canvas-fallback`
