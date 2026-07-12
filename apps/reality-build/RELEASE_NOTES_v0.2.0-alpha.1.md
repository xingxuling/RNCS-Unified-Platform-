# Reality Build Fabric v0.2.0-alpha.1 Release Notes

本版第一次把 RBF 从“多格式导出器”推进为“具备原生编译责任的发布织构”。

## 已完成

- 真实 Windows PE32+ GUI EXE；
- 无 BAT、无 Node.js、无外部 HTML 的 Windows 应用载荷；
- Android APK 自动构建目标；
- Android 调试签名与可选 `apksigner` 验证；
- 工具链能力预检和阻断；
- 构建图、目标清单和收据升级；
- 113 项自动测试。

## 尚未完成

- Windows Authenticode 签名；
- 内嵌 WebView2/Chromium；
- ARM64 Windows；
- Android release keystore、AAB 与商店上传；
- macOS/iOS；
- 自动更新与增量补丁。
