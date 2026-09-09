# Reality Build Fabric v0.2.0-alpha.1

**中文名：现实构建织构**

Reality Build Fabric 把 Reality Studio 统一项目编译成可验证、可缓存、可发布的多宿主产物。v0.2 不再只生成网页文件和工程壳，而是加入了真实 Windows GUI EXE 交叉编译、Android APK 自动构建目标、构建能力预检与环境证据。

```text
统一项目
→ 请求与项目验证
→ Asset Database 增量同步与缓存命中
→ 构建工具链 / 宿主能力预检
→ 资产内容寻址烘焙
→ Behavior + RSR Spatial Runtime 确定性回放
→ 物理快照 / 因果 delta / 导航清单
→ Web / Windows EXE / Android 工程或 APK
→ 文件完整性与 Target Root
→ Build Receipt
```

## 构建目标

| 目标 | 产物 | 当前边界 |
|---|---|---|
| `web-release` | 可部署 Web/PWA 文件夹 | 已实现 |
| `web-single` | 单 HTML | 已实现 |
| `windows-portable` | BAT + 浏览器兼容包 | 保留兼容 |
| `windows-native` | 双击运行的 PE32+ GUI EXE | EXE 内嵌应用；显示层调用系统 Edge/Chrome App Mode |
| `android-project` | Android Studio / Gradle 工程 | 含中文一键构建脚本 |
| `android-apk` | 已编译、调试密钥签名 APK | 构建机必须已有 JDK、Gradle、Android SDK 35 |

## 快速运行

```bash
npm test
node src/cli.mjs doctor
npm run build:sample
npm run verify:sample
npm run browser-test
```

单独构建 Windows EXE：

```bash
node src/cli.mjs build \
  --project examples/冰境试炼.unified-project.json \
  --out output/windows \
  --targets windows-native \
  --title 冰境试炼 \
  --app-id com.taowind.frosttrial
```

在已经配置 Android SDK 的构建机上直接生成 APK：

```bash
node src/cli.mjs build \
  --project examples/冰境试炼.unified-project.json \
  --out output/android \
  --targets android-apk \
  --title 冰境试炼 \
  --app-id com.taowind.frosttrial
```

启用 Reality Studio Asset Database：

```bash
node src/cli.mjs build --config examples/reality-build.json
```

启用后，构建输出会生成 `asset-database.json`、变更计划、同步收据和缓存索引；`web-release`、Windows 便携包、Android 工程、无头服务和回放包会携带这些证据，单文件 Web 则将资源数据库根和缓存制品摘要内嵌到 HTML。

## 空间运行时证据

构建请求可以提供按帧组织的 RSR 空间命令。每个命令必须使用整数定点值，轨迹会进入语义构建键：

```json
{
  "spatial_trace": [
    [{
      "type": "move-character",
      "characterId": "subject:player",
      "direction": {"x": 1000000, "y": 0, "z": 0}
    }]
  ]
}
```

构建器会独立重放空间轨迹并比较最终状态根，同时输出 `spatial-snapshot.json`、`spatial-causal-delta.json`、`spatial-runtime.manifest.json` 和可用时的 `tilemap-navigation.manifest.json`。`headless-server` 额外暴露 `/spatial-inspect` 与 `POST /spatial-step`，因此物理与导航状态可以被运行时验收，而不只停留在编辑器导出阶段。

## World Body candidate presentation

Build request 可以显式携带 `presentation_candidate`。`@taowind/reality-build-fabric` 不把含浮点 VSR scene 的 payload 写回 Unified Project；`createWorldBodyRealityBuildPresentationCandidate()` 只生成 candidate-only 的 presentation scene、body bindings 和 `presentation_root`，Build 再通过既有 `compileBoundPresentationScene()` 将它绑定到 authoritative RSR snapshot。请求 root、Build identity 和 runtime evidence 都会绑定这个 candidate root。

这条路径不会自动获得 commit 或 release authority。缺失 body node 默认阻断；`presentation_scene_source_root` 与 `presentation_binding_count` 会出现在 runtime evidence 中，并可通过 `verifyBuild()` 验证。它证明的是 Build consumer 的 root 连续性，不等于已闭合 World Body 的质量、资产、角色、网络或目标硬件能力。

## Large World spatial presentation candidate

Reality Build 还接受通用的 `reality-build.spatial-presentation-candidate.v0.1`。`createSpatialPresentationCandidate()` 可以直接封装已有 `vsr.spatial-scene.v0.4`，因此 Large World Runtime 的 `createSpatialScene()` 能通过同一个 `compileBoundPresentationScene()` 与 Build runtime evidence 接通：

```text
WorldSeed → Region → Chunk → URRF selection → VSR spatial scene
  → candidate presentation_root / presentation_source_root
  → Reality Build runtime evidence / target receipt
```

该接缝保持 source reference、scene root、project root 和 candidate-only authority；没有 body bindings 时不会伪造 RSR physical bodies。当前证据证明的是本地 Build 对 4 个 active streaming cells、17 个 VSR nodes、CPU-reference spatial frame 以及 4 个 `rncs://` candidate asset records 的 VSR streaming resolution（requested=4、missing=0）消费与自校验。

当 candidate 同时携带已有 Large World GLB provider bundle 时，Build 会保留 provider `format/version/bundle_root/manifest` 与 asset records，把 payload 写入 `web-release/assets/spatial/<sha256>.glb` 并生成 `spatial-asset-payload-manifest.json`；单文件/embedded HTML 使用同一 candidate payload 的 base64 版本。Chromium smoke 已真实通过现有 `VSRSpatialAssetStreamer` 读取并校验 36 条 catalog 中 33 条 active-cell payload（`ready=33`、`missing=0`、`failed=0`、`144632` bytes）。这仍不等于 GLB 已导入/绑定到 VSR scene、Android 设备、网络 transport、目标 GPU 或生产资产服务已闭合；3 条无 cell 归属的 provider payload 会保持 deferred。

## 诚实边界

- `windows-native` 是真实 Windows GUI EXE，不依赖 BAT 或 Node.js；但 v0.2 的渲染宿主仍使用 Windows 自带或已安装的 Edge/Chrome，而不是内嵌 Chromium/WebView2 Runtime。
- `android-apk` 已实现真实 Gradle 调用、产物检查、调试签名声明及可用时的 `apksigner` 验证；本发布环境没有 Android SDK/Gradle，因此发布样板只附 Android 工程，自动 APK 路径由隔离工具链测试验证。
- 正式商店 Android 发布仍需用户的 release keystore、AAB、商店元数据与真实设备矩阵。
- 原生 GPU、原生音频、增量补丁、自动更新和代码签名证书尚未完成。
- 浏览器 `web-release` 仍使用现有 Behavior 浏览器 runtime；RSR 物理、空间快照与导航目前作为 RNCS 构建证据和 headless 运行时接入，尚未声称已经替换浏览器渲染器。
- Large World spatial presentation candidate 仍是显式 candidate request；默认 Studio/Build authoring path 不变，`rncs://` candidate asset references 现在会进入确定性的 VSR streaming resolution，但尚未被该 Build seam 自动烘焙、下载、导入或上传成目标包内的生产资产。
