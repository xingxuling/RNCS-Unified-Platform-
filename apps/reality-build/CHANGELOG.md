# Changelog

## Unreleased — 2026-07-27

- 构建请求新增 `spatial_trace`，纳入语义构建键并执行两次独立 RSR 空间回放。
- 构建收据新增空间状态根、因果 delta 根、空间 runtime manifest 根和导航 manifest 根。
- VSR WebGPU frame plans now expose dynamic entity vertex ranges and light bindings; browser targets update those buffers from the authoritative behavior Tick and re-verify the resulting resource/frame roots.
- 构建输出新增 `spatial-snapshot.json`、`spatial-causal-delta.json`、`spatial-runtime.manifest.json`；含 TileMap 项目时新增 `tilemap-navigation.manifest.json`。
- `headless-server` 新增 `/spatial-inspect` 与 `POST /spatial-step`，回放 verifier 同时校验 Behavior 与空间状态根。
- Web targets now bundle the compiled RSR spec/spatial runtime, step behavior-bound 2D colliders per host Tick, expose spatial inspection/navigation roots, and feed verified spatial state roots into the dynamic GPU frame.
- 统一项目的可移植资产投影用于构建证据和目标回放，避免绝对路径造成 Behavior replay root 漂移。
- 接入浏览器安全的 VSR WebGPU Executor：构建产出 GPU frame plan、frame summary 与 viewport manifest。
- Web Release、单文件、Windows Portable 和嵌入式 Android HTML 优先尝试 WebGPU，失败时回退 Canvas 2D，并记录 frame receipt 入口。
- WebGPU 执行器保留纹理图集、tiled light compute、GPU particles、postprocess、设备丢失回退和 frame root 校验；动态客户端更新和 2D 浏览器 RSR 桥接现已接入，完整 3D/原生渲染与硬件矩阵仍待后续。

## v0.2.0-alpha.1 — 2026-07-02

- 新增 `windows-native`：通过 Go 交叉编译生成 PE32+ Windows GUI EXE。
- 应用 HTML、行为运行时和资产直接嵌入 EXE，不再依赖 BAT、Node.js或外部 HTML。
- 新增 `android-apk`：自动调用 Gradle `assembleDebug`，检查 APK、记录调试签名状态，并在可用时调用 `apksigner` 验证。
- Android 工程新增中文 BAT 与 Shell 一键构建脚本。
- 新增构建工具链与项目能力预检，阻止“没有工具链却伪装构建成功”。
- 构建图新增 `preflight` 节点，收据新增 `preflight_root`。
- CLI 新增 `doctor` 与 `targets`。
- 测试由 91 项增加至 113 项。

## v0.1.0-alpha.1 — 2026-07-01

- 首个 Web、单 HTML、Windows 浏览器便携包与 Android Studio 工程构建闭环。
