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

宿主现在还暴露 `setSpatial3DObserver()` / `setSpatial3DCamera()`：它们复用 VSR 的 spatial working-set resolution，并让同一 active-cell 集合进入 asset acquire/release/evict、GLB rebind 和 frame compilation。真实 Chromium candidate 在复位后验证了 4 cells/12 bindings → 单 cell/6 bindings（`released=36`、`evicted=18`）→ 另一单 cell/3 bindings；回入阶段真实重新加载 `8576` bytes，三个阶段均 `verified=true`、无导入失败。该证据关闭的是 web-release candidate 的动态工作集接缝，不是缓存性能曲线、Large World 新 chunk 生成、Android/物理设备 GPU、跨设备矩阵、跨节点网络 transport/session 或生产资产服务。

空间 payload loader 还可注入 VSR 的 `createVSRBrowserAssetCache()`：同一项目使用稳定 cache name，使用 `payload_root` 作为 revision root；CacheStorage 只保留 SHA-addressed、可丢弃的浏览器 bytes，VSR 仍拥有 catalog、lease、import、working set 和 residency receipt。真实 Chromium evidence 记录了首次 39 条 active payload misses、同一页面 cold reload 的 39 hits；切换到第二个 payload root 后旧条目被清空并发出 `VSR_BROWSER_ASSET_CACHE_REVISION_CHANGED`，新 revision 36 条 active payload 重新加载，下一次 cold reload 命中 36 条。该 provider 是浏览器 candidate lowering；Android lowering 另有独立的 WebView host 证据，远程 coherence、quota/SLA、物理设备和 production asset service 仍未闭合；浏览器收据见 `evidence/BROWSER_ASSET_CACHE_PROVIDER_v0.1.json`。

此前用同一 Large World presentation fixture 重新生成的 `android-project`（`index.html` 内嵌 base64 payload，而不是复用 web-release 外部 URI）经 Gradle 9.5.1 / Android SDK 35 构建出 `325945` bytes 的 debug APK，Windows `apksigner` v2 验签通过。在 `Rcl_Aether_API35_ATD` 的 Android WebView/CDP 中，初始 4 cells/33 ready payloads/11 bindings，远移后释放并驱逐 33 个 payload，回入 `cell:...:-1:-1` 后恢复 12 ready payloads/4 bindings；三阶段均 `verified=true`、`importFailed=0`、错误为空。证据写入 `evidence/LARGE_WORLD_ANDROID_EMBEDDED_DYNAMIC_CANDIDATE_v0.1.json`；这仍是 Emulator candidate，不是物理/目标设备 GPU、release 签名、持久 cache 性能或人工视觉验收。

## Android WebView CacheStorage candidate

Android 目标现在把内嵌 `index.html` 读入 WebView，并通过 `loadDataWithBaseURL("https://rncs.local/", ...)` 提供固定 synthetic origin。这个 lowering 复用了 VSR 的 `createVSRBrowserAssetCache()`，没有新增原生缓存桥或第二套资产生命周期；`https://rncs.local/` 只是本地文档 origin，不是远程网络服务。

真实源码生成、Gradle 9.5.1、Android SDK 35 和 `Rcl_Aether_API35_ATD` API 35 Emulator 验证了同一包的版本切换：v1 为 `39` 个缓存 miss / `170656` bytes，安装 v2 后新的 payload root 触发 `VSR_BROWSER_ASSET_CACHE_REVISION_CHANGED`，重新写入 `36` 个活动资产 / `156064` bytes；进程重启后重新命中 `36` 个缓存条目，`importFailed=0`、无运行时错误。改动前的 `file:///android_asset/index.html` 探针确认 CacheStorage 存在但 `Cache.put` 被 WebView 以 `Request scheme 'file' is unsupported` 拒绝。证据见 `evidence/ANDROID_ASSET_CACHE_PROVIDER_v0.1.json`。

Build request/schema 现在显式提供 `asset_cache.enabled` 与 `asset_cache.max_bytes`，并将该策略纳入 build identity；VSR `VSRSpatialAssetStreamer` 只使用 provider 已缓存 asset ids 作为加载顺序提示，resolution root、catalog、lease 和 authority ownership 不变。在同一 API 35 Emulator 的 `50,000`-byte provider budget 下，v1 进程重启重新命中 `8` 条、最终 resident `49,524` bytes/`28` 次 eviction；v2 revision invalidation 后最终 resident `47,496` bytes，v2 再次进程重启命中 `8` 条、最终 resident `46,980` bytes/`25` 次 eviction；所有阶段 `ready=39/36`、`importFailed=0`，最终 resident bytes 均未超过预算。该结果是共享 provider 的预算与调度 candidate，不代表 VSR 内存 working set 或 APK 内嵌 payload 大小受此预算限制。完整收据见 `evidence/ANDROID_ASSET_CACHE_BUDGET_CANDIDATE_v0.1.json`。

随后对同一 API 35 ATD profile 做了 provider 性能与 metadata 写入考古：`asset_cache.persist_accesses` 进入 request/schema/build identity，Reality Build 默认关闭跨进程 access telemetry 持久化；payload 写入仍等待 durable manifest flush，并将并发 manifest flush 合并。真实 WebView CDP 的 4×16 KB 并发 control 为 direct CacheStorage `772.3/799.2 ms`（write/read），provider 为 `2,182.4/1,856.8 ms`（含 SHA、rooted manifest 和 content-addressed bookkeeping）；8/32/128 KB 的半容量压力 probe 都保持两条 resident payload、两次 eviction。当前 source-generated v1/v2 的 cold/restart/revision phases 仍分别记录 `ready=39/36`、`importFailed=0`、resident `45,640/49,524/47,496/46,980` bytes。provider 的额外开销是当前 profile 的可见事实，不被描述成跨设备性能结论；quota guarantee、物理设备、remote coherence、release/production 与人工视觉验收仍未闭合。完整收据见 `evidence/ANDROID_ASSET_CACHE_PERFORMANCE_CANDIDATE_v0.1.json`。

这是 Android WebView/app-private CacheStorage 的 candidate execution evidence，不等于 WebView quota/eviction/performance 曲线、跨进程/跨设备 coherence、物理设备 GPU、release 签名、商店交付或人工视觉验收。

## Reality Studio UI/Input target lowering candidate

Reality Studio 已经拥有可执行的 reality-studio.ui-tree.v1.2、reality-studio.input-profile.v1.2、锚点布局、数据绑定、焦点导航和 InputActionRuntime。本轮没有复制一套 Build UI 语义，而是在 Build 验证后生成 reality-build.ui-input-runtime.v0.1，把 active UI tree、active input profile、layout、manifest root 和 lowering root 一起带入目标：

§§§text
Reality Studio UI/Input contract
  → Build validation + sealed ui-input runtime payload
  → browser DOM overlay / embedded WebView overlay
  → InputActionRuntime
  → existing BehaviorRuntime tick and authoritative state
§§§

由 ensureUIInputProject() 生成的真实构建 fixture 通过 web-release、web-single 和 android-project 三个 target。Chromium 的可访问性树实际出现 13 个 Studio UI 节点；桌面条件下 7 个节点可见，KeyD 让玩家位置从 70 变为 166，KeyP 让暂停面板和“已暂停”文本可见。API 35 Rcl_Aether_API35_ATD 上的同一 source-generated debug APK 通过 https://rncs.local/ synthetic origin 启动 WebView，触摸条件下 11 个节点可见，三个按钮都在 960×540 CSS viewport 内；设备级 adb shell input tap 366 924 让 ui:right 产生 move_right pressed event，并把玩家位置从 70 变为 73.2。Build/Gradle/apksigner 与运行时收据见 evidence/BUILD_UI_INPUT_TARGET_LOWERING_CANDIDATE_v0.1.json。

这里的 owner 仍是 Reality Studio；DOM/WebView 只是平台 lowering，不拥有 World Body IR、canonical world state、authority、commit 或 release。截图和 accessibility tree 只能证明候选目标链路已经执行，默认 Studio fixture 的标题/生命面板相邻关系仍需要人工视觉验收；物理设备、原生 GPU UI、无障碍/本地化、网络 transport、release 签名和生产交付没有被本轮关闭。

## Animation target lowering candidate

VSR v0.8 已经拥有确定性 clip sampling、animation root、蒙皮、morph、animation graph/layer 和 glTF import；RAGF 的真实 showcase GLB 也带有 1 个 skin、4 个 animation clips、1 个 morph target。此前 Build 的缺口不是再造动画 runtime，而是两处真实接缝：初始/每 Tick 的 `compileSpatialFrame()` 没有收到确定性 animation clock，`replace-mesh` 组合路径也没有保留导入骨骼、动画通道和支撑关节节点。

本轮先增加 candidate-only 的 fixed-tick lowering，并在同一 seam 上扩展 VSR layers/graph selection：

```text
sealed animation_policy {selection: clip|layers|graph, tick_hz, speed, phase_seconds, loop, ...}
  → phase_seconds + max(spatial Tick, 0) / tick_hz * speed
  → existing VSR animation / animationLayers / animationGraph options
  → existing VSR compileSpatialFrame / WebGPU render options
  → animationRoot / frameRoot receipt
```

变形 GLB 的唯一 render node 映射到显式绑定的 world node，其余骨骼层作为 support nodes 保留；多 render node、缺失 render node 或非 identity 的变形 render transform 失败闭合。RSR 仍只拥有 authoritative world state/clock，Studio Sequencer 仍是 authored presentation owner，Build 不把动画 policy 写回 World Body IR 或 RCL Core。

由 `冰境试炼` candidate scene 生成的 web-release 与 Android embedded HTML 都携带同一 policy 和 initial animation root；本地 `verifyBuild()` 有效。真实 Chromium/WebGPU 中 reset 后 Tick 0 的时间为 `0`，手动推进 15 个 spatial ticks 后为 `0.25` 秒，`animationRoot` 变化、两帧均 `verified=true`、应用错误为 `0`。RAGF GLB → VSR import → replace-mesh → skin/animation frame probe 也验证了 `9` 个导入节点、`1` 个 skin、`4` 个 clips、`8` 个 support nodes 和 `skinnedDraws=1`。完整收据见 `evidence/BUILD_ANIMATION_TARGET_LOWERING_CANDIDATE_v0.1.json`。

固定 clip、layers 和 graph 的 Build target lowering 已在 candidate scope 内验证；这仍不是完整动画生产链：Studio authored Sequence lowering、事件驱动的动画状态机、约束/全量 deformation policy、物理设备/原生 GPU、性能曲线、人工视觉验收和 K400 PASS 仍未关闭。layers/graph 的独立收据见 `evidence/BUILD_ANIMATION_GRAPH_LAYER_LOWERING_CANDIDATE_v0.1.json`。

同一 graph candidate 又通过真实 Gradle 9.5.1 / Android SDK 35 生成并验签 debug APK，安装到 `Rcl_Aether_API35_ATD` 后由 `MainActivity` 的 WebView 加载 `https://rncs.local/`，CDP 读取到 Tick 0 的 `run` 状态与 `walk → run` transition（`0.25`），并在同一同步调用中推进 15 个 tick 到 `0.25s`；`animationRoot`、`frameRoot` 改变，两个 frame 均 `verified=true`、draw count 为 5、应用/资产错误为空。收据见 `evidence/ANDROID_ANIMATION_GRAPH_TARGET_LOWERING_CANDIDATE_v0.1.json`。这是 Emulator/WebView target-lowering candidate：APK 是 debug 签名，设备的 primary GPU 报告 `WebGPU adapter unavailable`，没有观察到 spatial WebGPU submission receipt，因此不宣称原生 GPU、物理设备、帧率、视觉 parity 或 release 交付。

## Authored Sequence target lowering archaeology and evaluated-frame candidate

Reality Studio 已有 `reality-studio.sequence.v1.7`、`SequencerSession` 和 `evaluateSequence()`；它们能把 authority tracks 与 presentation tracks 分开，并稳定生成 `sequence_root`、`authority_root`、`presentation_root`、`frame_root`。`冰境试炼.unified-project.json` 原始文件仍没有 `sequencer` 字段；Studio session 运行时生成的 default sequence 只有 camera clip，animation/audio clip 数量为 0。这个原始项目边界和负证据仍由 `evidence/BUILD_SEQUENCE_TARGET_LOWERING_AUDIT_v0.1.json` 记录。

在不移动 timeline ownership、也不添加第二套 evaluator 的前提下，Build 现在接受一个显式的 Studio evaluated-frame projection：

```text
Reality Studio evaluateSequence()
  → sequence-frame.v1.6 + authority/presentation/frame roots
  → explicit track/clip/node binding
  → reality-build.sequence-frame-projection.v0.1
  → existing VSR animationLayers / compileSpatialFrame()
  → web-release payload + runtime evidence
```

该 candidate 现在覆盖 active animation 和 camera presentation entries；Build 做规范化根校验和 fail-closed binding 检查，camera binding 只选择现有 VSR camera 并 lower 为 `activeCameraId`，浏览器仍只消费 evaluated time/selection，不重新计算 Sequence。实际 web-release 构建通过 `verifyBuild()`，Chromium/WebGPU camera+animation 运行报告 `camera:alternate`、`selection=sequence-frame`、`mode=evaluated-frame`、`time=0.25`、`verified=true`、4 draw calls、806 triangles，并观察到 `submitted=true`、`deviceLost=false`。完整收据见 `evidence/BUILD_SEQUENCE_CAMERA_FRAME_PROJECTION_CANDIDATE_v0.1.json`；动画-only projection 的收据仍见 `evidence/BUILD_SEQUENCE_FRAME_PROJECTION_CANDIDATE_v0.1.json`。

这不是 target-side Sequence playback、camera transform/lens interpolation 或 timeline editing；audio、dialogue、effect、light、behavior、quest、network、physics、branch 等 track class 仍未 lower。音频 cue-to-asset 仍独立保持 blocked，`RCL_GAP_RNCS_SHARED_AUTHORED_PRESENTATION_SPINE` 仍未晋升为完整闭环。

## Audio target lowering archaeology（negative candidate）

本轮没有新增音频系统，而是沿着真实源资产做了一次可证伪审计。`asset:3a82d1753e140d24552b89d1` 的 `sfx-wav` 文件在 web-release 中确实被烘焙为 `assets/ba8ebd46...e.wav`（19888 bytes，SHA-256 保持一致），但 `assetRuntimeMap()` 当前只暴露 `primary_visual`；Behavior 的 `experience.audio.emit` cue（如 `footstep-ice`）没有 `asset_id`/file-role 绑定。RSR 的 `spatial-audio` 事件也能在同一 Build 页面生成 `impact.generic`，但 Build host 只收集事件，没有音频 consumer。

真实 Chromium source build（`output/playwright/audio-source-audit-v02`）达到 `readyState=complete`、`0` application errors；instrumented step 证明 procedural oscillator fallback 被进入并启动，但没有 `decodeAudioData`、WAV 请求或真实音频播放收据。Experience Fabric Audio 已有 oscillator/sample 与离线 WAV renderer，Audio Scene Runtime 已有 stem/render 语义；这些是 donor，不等于浏览器/Android target lowering。完整负证据见 `evidence/BUILD_AUDIO_TARGET_LOWERING_AUDIT_v0.1.json`，状态为 `CANDIDATE_NEGATIVE_EVIDENCE_ONLY`。

当前缺口记录为 `RCL_GAP_RNCS_AUDIO_TARGET_LOWERING`：必须先裁决 cue-to-asset 的 canonical owner 和 receipt shape，再复用现有资产清单、Behavior/RSR timing/spatial 参数做最小 target lowering。打包文件不能描述成播放完成；instrumented AudioContext 也不是 native audio、延迟、混音质量或人工听感证据。本轮没有新增 K400 PASS。

## Audio target binding candidate

在上述负证据基础上，本轮只补齐了最小的显式 target seam，没有建立第二套音频语义系统：

```text
Reality Studio setAudioCueBinding()
  → rncs.audio-target-profile.v0.1
  → @taowind/audio-target-runtime
  → Reality Build audio-target-plan.json
  → existing content-addressed WAV
  → reality-build.web-audio-buffer
  → browser target receipt
```

Studio 现在保存 `cue_id → asset_id → file_role → asset_sha256`，Build 复用已有资产清单，把音频文件暴露为 `audio_files`，但不把它提升为 `primary_visual`。计划只接受精确资产记录、文件角色、`audio/*` MIME 与 SHA-256 匹配；缺失资产、角色、MIME、哈希和未封存 profile 都会阻断，不做 cue 名或“第一个音频文件”的推断。没有 profile 的旧项目仍可进入明确标注的 legacy procedural fallback，这不是源 WAV 播放。

对一份新生成的 web-release，真实本地 Chromium 请求了 `assets/ba8ebd46...e.wav`，并观察到 `decode-pending → scheduled` 收据，页面错误为 0。该结果只证明精确目标文件请求、Web Audio 解码调度与收据身份；`spatial_parameters_forwarded=false`，因此不宣称 RSR 空间参数已变成 3D 音频，也不宣称可听输出、延迟、混音质量、Android/native audio、物理设备或人工听感。完整证据见 `evidence/BUILD_AUDIO_TARGET_BINDING_CANDIDATE_v0.1.json`，缺口仍为 `RCL_GAP_RNCS_AUDIO_TARGET_LOWERING`，没有新增 K400 PASS。

同一计划随后通过既有 `embeddedHtml()` seam 进入 `android-project` 和 `android-apk`。本机用 Gradle 9.5.1 / Android SDK 35 生成并用 APK Signature Scheme v2 验签 debug APK，安装到 API 35 `Android ATD built for x86_64` Emulator；WebView 通过已有 `loadDataWithBaseURL("https://rncs.local/", ...)` 加载，CDP 在 `reset()` 后触发 `footstep-ice`，等待 7 秒观察到 `decode-pending → scheduled`，应用异常为 0。因为 WAV 是内嵌 data URI，这里没有远程音频请求；这仍然只是 WebView buffer scheduling candidate，不是扬声器、耳机、空间化、延迟、物理设备或人工听感证据。完整收据见 `evidence/ANDROID_AUDIO_TARGET_BINDING_CANDIDATE_v0.1.json`。

## RSR spatial audio Provider candidate

在显式 cue-to-file seam 之后，Build 继续复用 RSR 的空间语义，不改 RSR event owner：

```text
RSR spatial-audio event
  → explicit audio-target binding + spatial_policy.listener_id
  → Web Audio PannerNode / occlusion low-pass lowering
  → receipt with source parameters and spatial_parameters_forwarded
```

`spatial_policy.listener_id` 必须指向目标空间快照中已经存在的 RSR listener；Build 不猜测第一个 listener，也不把 2D/3D 空间混用。`position` 按 RSR `position_scale` 转换，`gainQ`、`pitchQ`、`minDistance`、`maxDistance` 和 `occlusionQ` 进入 Provider 的参数映射；没有显式策略或 listener 时保持未空间化或阻断，并在收据中说明原因。真实 Chromium 与 API 35 Android WebView 候选都观察到 3D RSR 的 `impact.body` 在 Tick 1 经精确 WAV `decode-pending → scheduled`，`spatial_parameters_forwarded=true`；Chromium 页面异常为 0，Android CDP 未收到应用异常。这个结果是目标 Provider 执行证据，不是可听输出、空间感知等价、延迟、混音质量、Android 原生音频、物理设备或人工听感证据。完整收据见 `evidence/BUILD_AUDIO_SPATIAL_PROVIDER_CANDIDATE_v0.1.json`；仍不晋升任何 K400 PASS。

## Audio Provider lifecycle diagnostics candidate

上一轮只证明了空间参数能进入 Provider；本轮沿现有 `audio-target` seam 补齐目标侧生命周期收据，没有把 Experience Fabric 的离线 `maxVoices`/bus 策略偷偷复制到 Web/Android。`audioSnapshot().provider_diagnostics` 现在记录 AudioContext state/sample rate、resume 成功/失败、content-addressed decode 请求与耗时、pending load 清理、缓存 buffer、active/peak/ended/stopped voices 和 provider error；`reset()` 会停止仍在运行的 source。

同一显式 `impact.body` 候选在本地 Chromium 中观察到 `resume_succeeded=1`、decode `1/1`、`pending_decode_count=0`、`decode_latency_ms_last≈957.7ms`、active voice `1→0`；API 35 Android WebView 中为 `≈421.6ms`，应用异常为 `0`。这只是 Provider 生命周期与目标执行观测，不是跨设备 latency 曲线、并发/混音质量、扬声器输出、native audio、物理设备或人工听感证据。完整收据见 `evidence/BUILD_AUDIO_PROVIDER_LIFECYCLE_CANDIDATE_v0.1.json`；不晋升任何 K400 PASS。

## Audio target asset residency candidate

本轮没有新增音频 authored schema，也没有把 Experience Fabric 的离线 `maxVoices`、cue `maxInstances`、cooldown 或 bus graph 复制到目标侧。已确认的 owner 保持不变：RSR / Experience Fabric 拥有 cue identity、timing、tick、空间参数和离线渲染语义；VSR 拥有通用 content-addressed asset 的依赖、SHA 校验、并发加载、ready/lease/evict receipt；Reality Build 只把显式 audio target binding lower 到目标 Provider。

```text
sealed audio-target-plan binding
  → existing VSRSpatialAssetStreamer { kind: audio }
  → SHA-256 verified asset bytes / VSR receipt root
  → Web Audio decodeAudioData
  → scheduled target receipt
```

Build 现在从已 bound 的 `cue_id → asset_id → file_role → asset_sha256` 生成临时 VSR audio catalog，批量调用既有 `VSRSpatialAssetStreamer`（现有 Provider 默认 `maxConcurrent=4`），再把经过 VSR receipt 校验的 bytes 交给原有 Web Audio buffer Provider。相同内容地址的多个 cue 共享 VSR ready bytes；`reset()` 会停止 active sources，并释放/驱逐本轮 audio asset leases。最终 `taowind.audio-target-browser-receipt.v0.1` 带有 `asset_stream_receipt_root`，因此目标解码 receipt 与 VSR 资产 receipt 可以追溯到同一内容根。

真实本地 Chromium source build 观察到：精确 WAV 请求 `200`，VSR audio catalog `ready=1`、`bytes_resident=19888`、`failed=0`、`blocked=0`、`max_concurrent=4`，Web Audio `decode=1/1`，并在 `scheduled` receipt 中携带 VSR `receipt_root`；页面错误为 `0`。完整收据见 `evidence/BUILD_AUDIO_VSR_ASSET_STREAMING_CANDIDATE_v0.1.json`。

这只关闭了“显式音频目标文件 → 既有 VSR asset residency → Web Audio decode”的浏览器 candidate seam。它不宣称 target-side voice cap、mixer/bus lowering、连续/分段音频 streaming、音频缓存预算、Android/原生音频、跨设备 latency、扬声器输出、物理设备或人工听感；不新增 K400 PASS。`RCL_GAP_RNCS_AUDIO_TARGET_LOWERING` 仍保持开放，下一步应单独复验 embedded Android WebView 的同一 VSR receipt，再决定是否有独立的 provider cache/stream policy 缺口。

## Network compilation → headless candidate

Reality Build 现在消费既有 Reality Studio `project.network`，不再只把 network authoring 留在 Studio 导出侧：

```text
Unified Project.project.network
  → existing compileNetworkWorld()
  → verified network-world-compilation.json
  → Build receipt / integrity / build identity roots
  → headless-server loopback + authority HTTP endpoints
  → existing RealityNetworkRuntime session / HttpAuthorityClient / ClientPredictionRuntime
```

构建图新增 `network-compilation` 节点，并把 `compilation_root` 纳入 Build identity、core files、receipt 和自校验。`headless-server` 目标会携带同一 compilation artifact，按需声明 `@taowind/reality-network-runtime`。旧 `/network/*` 端点继续走既有 local loopback session；新增 `/network/authority/*` 端点则返回 compiled slot delegation/snapshot，接收既有 `network.input.v0.2` packet，并返回 authority tick 的 ack/snapshot/delta。`HttpAuthorityClient` 复用既有 `ClientPredictionRuntime`，从 join 建立客户端预测、提交 packet，并消费 ack/delta；集成测试真实启动生成的 `server.mjs`，验证两个 loopback slots 和独立 HTTP client 的 source root、ack convergence 与同步状态；篡改或删除根 artifact 会使 `verifyBuild()` 失败。

这是 `CANDIDATE_LOCAL_HTTP_AUTHORITY_VERIFIED`，不是 WAN、真实跨设备/跨节点 transport、安全密钥、压测、生产部署或 release promotion 证据。Web/Android embedded targets 只保持自身的 presentation/runtime 路径，没有被静默改成网络客户端。

## 诚实边界

- `windows-native` 是真实 Windows GUI EXE，不依赖 BAT 或 Node.js；但 v0.2 的渲染宿主仍使用 Windows 自带或已安装的 Edge/Chrome，而不是内嵌 Chromium/WebView2 Runtime。
- `android-apk` 已实现真实 Gradle 调用、产物检查、调试签名声明和 Windows `apksigner` 验证；本轮本机用 Gradle 9.5.1、Android SDK 35 生成并验签了 Large World debug APK，并在 `Rcl_Aether_API35_ATD` Emulator 完成 WebView 冷启动、payload revision invalidation 与进程重启 rehydrate candidate。没有相应工具链的环境仍只产出 Android 工程；WebView quota/eviction/performance、物理/目标设备 GPU 矩阵与正式商店发布仍需独立证据、release keystore、AAB 和元数据。
- 正式商店 Android 发布仍需用户的 release keystore、AAB、商店元数据与真实设备矩阵。
- 原生 GPU、原生音频、增量补丁、自动更新和代码签名证书尚未完成。
- 浏览器 `web-release` 仍使用现有 Behavior 浏览器 runtime；RSR 物理、空间快照与导航目前作为 RNCS 构建证据和 headless 运行时接入，尚未声称已经替换浏览器渲染器。
- Large World spatial presentation candidate 仍是显式 candidate request；默认 Studio/Build authoring path 不变，`rncs://` candidate asset references 现在会进入确定性的 VSR streaming resolution，并在 web-release candidate host 中完成受显式 plan 约束的下载、导入、mesh binding 与 WebGPU 提交，但尚未成为 canonical world truth、默认生产资产管线、Android/原生目标或跨设备发布能力。
