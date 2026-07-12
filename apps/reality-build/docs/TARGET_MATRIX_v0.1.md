# 构建目标矩阵 v0.1

| 能力 | Web Release | Web Single | Windows Portable | Android Project |
|---|---:|---:|---:|---:|
| 真实行为运行时 | ✓ | ✓ | ✓ | ✓（内嵌） |
| 内容寻址外部资产 | ✓ | — | — | — |
| 资产内嵌 | 可选 | ✓ | ✓ | ✓ |
| PWA清单 | ✓ | — | — | — |
| 离线Service Worker | ✓ | — | — | — |
| 单文件分发 | — | ✓ | ✓ | 内嵌Assets |
| 免安装启动 | 浏览器 | 浏览器 | BAT + App Mode | 安装APK后 |
| 原生可执行文件 | 否 | 否 | 否 | 需后续Gradle编译 |
| 文件级证据 | ✓ | ✓ | ✓ | ✓ |

## 后续目标

- Windows Native Host；
- Android APK/AAB 自动签名；
- macOS App Bundle；
- Linux AppImage；
- iOS Xcode Project；
- 热更新与增量补丁；
- 商店元数据和平台SDK。
