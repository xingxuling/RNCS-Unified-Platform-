# URRF Large World → VSR Spatial WebGPU

这组证据验证了同一条 lowering 链：

`RNCS active chunk working set → URRF per-chunk portfolio selection → VSR spatial scene → VSR spatial frame → browser WebGPU submission`

## 结果

- `LOWERING: PASS`：scene 使用 `rncs.large-world-spatial-scene.v0.1` 扩展，scene root 可复验，9 个活动 chunk 保持 1 个 `STANDARD` + 8 个 `PROXY` 的组合。
- `FRAME: PASS`：VSR frame verifier 通过；48 个节点、14 个 GPU-driven draw groups、1116 个三角形、9 个 active cells，并保持确定性 frame root。
- `CPU_REFERENCE: PASS`：CPU reference PNG 可重复，作为跨宿主对照，不冒称生产级画质。
- `BROWSER_WEBGPU: PASS (HOST-SPECIFIC)`：Chromium 实际报告 `available=true`，`submitted=true`，包含 1 个 shadow pass、1 个 velocity pass、1 个 tone-map pass、1 个 SSGI pass；receipt 只代表本机浏览器宿主，不代表目标硬件帧率或跨平台兼容性。

## 文件

- [large-world-spatial-scene.json](./large-world-spatial-scene.json)：浏览器可消费的 VSR scene lowering。
- [large-world-spatial-reference.png](./large-world-spatial-reference.png)：确定性 CPU reference。
- [large-world-webgpu.html](./large-world-webgpu.html)：静态浏览器入口；无 WebGPU 时只显示 reference。
- [large-world-webgpu-browser-receipt.json](./large-world-webgpu-browser-receipt.json)：实际 Chromium WebGPU submission receipt。
- [large-world-webgpu-browser.png](./large-world-webgpu-browser.png)：实际浏览器画面截图。
- [large-world-webgpu-report.json](./large-world-webgpu-report.json)：Node lowering/frame 报告与根。

## 边界与下一缺口

当前画面是可验证的程序化网格与低密度结构投影，证明的是表示组合、空间 lowering、GPU 执行和证据闭环，不是 AAA 资产质量。下一阶段应接入依赖完整的高密度 mesh/glTF/纹理 provider，并在同一 selection root 下补 HLOD、跨 cell 资产驻留与目标设备性能证据。

RNCS 仍拥有世界真值；URRF 拥有表示组合；VSR/WebGPU 只是 projection/lowering/execution。所有 provider 与 scene 字段均保持 candidate-only，不能写入 canonical world state。
