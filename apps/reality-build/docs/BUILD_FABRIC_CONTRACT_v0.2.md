# Reality Build Fabric Contract v0.2

## 1. 输入

RBF v0.2 接受 `reality-build.request.v0.1` 规范化请求和 `reality-studio.unified-project.v0.9` 项目。

请求必须明确：

- 项目文件与输出目录；
- 构建目标；
- 应用身份、标题和版本；
- 质量档位；
- 缺失资产与确定性政策。

可选的 `asset_database` 用于把 Reality Studio 的增量资源数据库接入构建：

- `cache_dir`：内容寻址缓存目录；
- `source_roots`：相对于项目文件的资源源根；
- `profiles`：派生缓存 profile，默认 `runtime`；
- `materialize`：是否在同步阶段生成或命中缓存 payload。

启用后，构建会先生成 `asset-change-plan.json` 和 `asset-database-sync.json`，再从缓存 payload 烘焙资产；所有非单文件目标携带同一组资源证据，单文件 Web 将其内嵌在运行时 payload 中。

可选的 `spatial_trace` 按帧承载 RSR 空间命令。命令使用整数定点坐标，轨迹进入语义构建键；构建器会独立重放轨迹并比较空间状态根。空间构建证据包括 `spatial-snapshot.json`、`spatial-causal-delta.json`、`spatial-runtime.manifest.json`，项目含 TileMap 时还包括 `tilemap-navigation.manifest.json`。

## 2. 构建图

```text
validate
→ preflight
→ runtime-evidence（Behavior + RSR Spatial）
→ asset-bake
→ target:*
→ receipt
```

`preflight` 必须在任何目标生成前确认构建工具链。需要原生编译的目标不得在工具链缺失时降级成“看似成功”的工程目录。

## 3. 目标契约

### windows-native

必须生成：

- 一个 PE32+ Windows GUI EXE；
- `app-manifest.json`；
- 中文使用说明；
- `target-receipt.json`。

EXE 必须内嵌应用，不得依赖 BAT、Node.js 或旁置 HTML。v0.2 允许调用系统浏览器作为显示后端，但必须在清单中明确声明。

### android-apk

必须：

- 生成 Android 工程；
- 调用真实 Gradle 构建；
- 找到实际 APK；
- 验证 ZIP 结构；
- 记录签名身份；
- 在 `apksigner` 可用时执行签名验证；
- 工具链或编译失败时整体失败。

v0.2 的自动 APK 是调试签名包，不冒充商店发布包。

## 4. 证据

每次成功构建必须生成：

- `build-graph.json`
- `validation.json`
- `build-preflight.json`
- `asset-manifest.json`
- 启用 Asset Database 时的 `asset-database.json`、`asset-change-plan.json`、`asset-database-sync.json`、`asset-cache-index.json`
- `integrity-manifest.json`
- `runtime-evidence.json`、`runtime-timeline.json`、`runtime-replay.json`、`runtime-checkpoint.json`
- `spatial-snapshot.json`、`spatial-causal-delta.json`、`spatial-runtime.manifest.json`
- 含 TileMap 项目的 `tilemap-navigation.manifest.json`
- 每个目标的 `target-receipt.json`
- `build-receipt.json`
- 非确定性的性能指标 `build-metrics.json`

## 5. 失败原则

以下情况必须失败：

- 项目或请求无效；
- 原生目标缺少必要工具链；
- 原生编译器返回非零状态；
- 目标文件未产生；
- APK 不是 ZIP；
- 可用 `apksigner` 明确判断签名无效；
- 构建后完整性自检失败。
