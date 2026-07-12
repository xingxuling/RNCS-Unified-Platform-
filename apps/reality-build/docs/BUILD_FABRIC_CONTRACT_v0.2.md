# Reality Build Fabric Contract v0.2

## 1. 输入

RBF v0.2 接受 `reality-build.request.v0.1` 规范化请求和 `reality-studio.unified-project.v0.9` 项目。

请求必须明确：

- 项目文件与输出目录；
- 构建目标；
- 应用身份、标题和版本；
- 质量档位；
- 缺失资产与确定性政策。

## 2. 构建图

```text
validate
→ preflight
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
- `integrity-manifest.json`
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
