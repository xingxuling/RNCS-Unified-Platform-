# Visual Reality Compiler API v0.2

入口：`packages/visual-reality-compiler/src/index.ts`

## compileVisualRealityPlan

```ts
compileVisualRealityPlan(displayState, config, resources?)
```

输出：

- 观察者与设备预算；
- 可见性记录；
- 材质分配；
- 顺序安全批次；
- 灯光瓦片；
- Render Graph；
- WGSL 模块与资源生命周期；
- WebGPU / Hybrid 子计划；
- 统计、语义不变量、Plan Root 和 Evidence Root。

## verifyVisualRealityPlan

检查来源状态、项目覆盖、批次唯一性、Pass 依赖、统计和证据根。

## comparePerceptualPlans

比较两个设备或观察者计划是否保持来源现实及非装饰语义等价。

## renderVisualRealityReference

生成确定性 CPU 参考 PNG，包含：

- 材质颜色覆盖；
- 参考硬阴影；
- Ambient / Directional / Point Light；
- ACES / Reinhard Tone Mapping；
- Exposure、Contrast、Saturation、Gamma；
- Bloom、Vignette、Chromatic Aberration、Grain；
- Pixel Root。

## CLI

```bash
node dist/packages/cli/src/cli.js visual-plan \
  examples/visual-reality-showcase.vsr.json \
  examples/visual-reality-showcase.config.json \
  --time 0 --out outputs/visual-plan.json

node dist/packages/cli/src/cli.js visual-render \
  examples/visual-reality-showcase.vsr.json \
  examples/visual-reality-showcase.config.json \
  --time 0 --out outputs/visual.png
```
