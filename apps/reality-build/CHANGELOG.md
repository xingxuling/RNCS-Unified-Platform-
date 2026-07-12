# Changelog

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
