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

该接缝保持 source reference、scene root、project root 和 candidate-only authority；没有 body bindings 时不会伪造 RSR physical bodies。当前证据证明的是本地 Build 对 4 个 active streaming cells、17 个 VSR nodes、CPU-reference spatial frame 以及 4 个 `rncs://` candidate asset records 的 VSR streaming resolution（requested=4、missing=0）消费与自校验；显式 asset-binding plan 现在把 provider record 的 `source_mesh_id`、LOD 和 cell 归属带入目标加载器。

当 candidate 同时携带已有 Large World GLB provider bundle 时，Build 会保留 provider `format/version/bundle_root/manifest` 与 asset records，把 payload 写入 `web-release/assets/spatial/<sha256>.glb` 并生成 `spatial-asset-payload-manifest.json`；单文件/embedded HTML 使用同一 candidate payload 的 base64 版本。Chromium smoke 已真实通过现有 `VSRSpatialAssetStreamer` 读取并校验 36 条 catalog 中 33 条 active-cell payload（`ready=33`、`missing=0`、`failed=0`、`144632` bytes），再用现有 VSR glTF/GLB importer 导入选中的 payload，并按 11 条显式 binding 进行 mesh replacement；Build 初始工作集随后复用 `reconcile()` 生成 `vsr.spatial-asset-transition.v0.1` receipt，但因为固定工作集未超预算，本次浏览器 transition 的 `released=0`、`evicted=0`，不能代替动态 cell/camera eviction 性能证据。本机 WebGPU receipt 为 `drawCalls=11`、`triangles=402`、`submitted=true`、`deviceLost=false`，同时捕获了 3D 画布截图。由同一 candidate 生成的 Android 工程又在本机通过 Gradle 9.5.1 产出 debug APK，并由 Windows `apksigner` 验签；该 APK 在 `Rcl_Aether_API35_ATD` Emulator 中冷启动两次，WebView 通过 CDP 重新得到 33/33 payload、11 bindings、RSR/3D `verified=true` 和 Canvas2D fallback。物理/目标设备 GPU、跨设备矩阵、跨节点网络 transport/session 或生产资产服务仍未闭合；3 条无 cell 归属的 provider payload 会保持 deferred，人工视觉验收也仍独立于自动化证据。

宿主现在还暴露 `setSpatial3DObserver()` / `setSpatial3DCamera()`：它们复用 VSR 的 spatial working-set resolution，并让同一 active-cell 集合进入 asset acquire/release/evict、GLB rebind 和 frame compilation。真实 Chromium candidate 在复位后验证了 4 cells/12 bindings → 单 cell/6 bindings（`released=36`、`evicted=18`）→ 另一单 cell/3 bindings；回入阶段真实重新加载 `8576` bytes，三个阶段均 `verified=true`、无导入失败。该证据关闭的是 web-release candidate 的动态工作集接缝，不是持久 cache 性能、Large World 新 chunk 生成、Android/物理设备 GPU、跨设备矩阵、跨节点网络 transport/session 或生产资产服务。

随后用同一 Large World presentation fixture 重新生成了真正的 `android-project`（`index.html` 内嵌 base64 payload，而不是复用 web-release 外部 URI），经 Gradle 9.5.1 / Android SDK 35 构建出 `325945` bytes 的 debug APK，Windows `apksigner` v2 验签通过。在 `Rcl_Aether_API35_ATD` 的 Android WebView/CDP 中，初始 4 cells/33 ready payloads/11 bindings，远移后释放并驱逐 33 个 payload，回入 `cell:...:-1:-1` 后恢复 12 ready payloads/4 bindings；三阶段均 `verified=true`、`importFailed=0`、错误为空。证据写入 `evidence/LARGE_WORLD_ANDROID_EMBEDDED_DYNAMIC_CANDIDATE_v0.1.json`；这仍是 Emulator candidate，不是物理/目标设备 GPU、release 签名、持久 cache 性能或人工视觉验收。

## Network compilation → headless candidate

Reality Build 现在消费既有 Reality Studio `project.network`，不再只把 network authoring 留在 Studio 导出侧：

```text
Unified Project.project.network
  → existing compileNetworkWorld()
  → verified network-world-compilation.json
  → Build receipt / integrity / build identity roots
  → headless-server local loopback endpoints
  → existing RealityNetworkRuntime session
```

构建图新增 `network-compilation` 节点，并把 `compilation_root` 纳入 Build identity、core files、receipt 和自校验。`headless-server` 目标会携带同一 compilation artifact，按需声明 `@taowind/reality-network-runtime`，并通过 `/network/health`、`/network/join`、`/network/input`、`/network/tick`、`/network/disconnect`、`/network/reconnect` 实际调用既有编译世界、权威 server、预测/回滚和 loopback transport。集成测试真实启动生成的 `server.mjs`，加入两个 compiled slots、提交 move、推进 tick，并验证 source compilation root 与两个 client 的同步状态；篡改或删除根 artifact 会使 `verifyBuild()` 失败。

这是 `CANDIDATE_LOCAL_LOOPBACK_VERIFIED`，不是 WAN、真实跨设备/跨节点 transport、安全密钥、压测、生产部署或 release promotion 证据。Web/Android embedded targets 只保持自身的 presentation/runtime 路径，没有被静默改成网络客户端。

## 诚实边界

- `windows-native` 是真实 Windows GUI EXE，不依赖 BAT 或 Node.js；但 v0.2 的渲染宿主仍使用 Windows 自带或已安装的 Edge/Chrome，而不是内嵌 Chromium/WebView2 Runtime。
- `android-apk` 已实现真实 Gradle 调用、产物检查、调试签名声明和 Windows `apksigner` 验证；本轮本机用 Gradle 9.5.1、Android SDK 35 生成并验签了 Large World debug APK，并在 `Rcl_Aether_API35_ATD` Emulator 完成两次 WebView 冷启动候选检查。没有相应工具链的环境仍只产出 Android 工程；物理/目标设备 GPU 矩阵与正式商店发布仍需独立证据、release keystore、AAB 和元数据。
- 正式商店 Android 发布仍需用户的 release keystore、AAB、商店元数据与真实设备矩阵。
- 原生 GPU、原生音频、增量补丁、自动更新和代码签名证书尚未完成。
- 浏览器 `web-release` 仍使用现有 Behavior 浏览器 runtime；RSR 物理、空间快照与导航目前作为 RNCS 构建证据和 headless 运行时接入，尚未声称已经替换浏览器渲染器。
- Large World spatial presentation candidate 仍是显式 candidate request；默认 Studio/Build authoring path 不变，`rncs://` candidate asset references 现在会进入确定性的 VSR streaming resolution，并在 web-release candidate host 中完成受显式 plan 约束的下载、导入、mesh binding 与 WebGPU 提交，但尚未成为 canonical world truth、默认生产资产管线、Android/原生目标或跨设备发布能力。
