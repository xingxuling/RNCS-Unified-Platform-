# Reality Build Fabric v0.2.0-alpha.1

**中文名：现实构建织构**

Reality Build Fabric 把 Reality Studio 统一项目编译成可验证、可缓存、可发布的多宿主产物。v0.2 不再只生成网页文件和工程壳，而是加入了真实 Windows GUI EXE 交叉编译、Android APK 自动构建目标、构建能力预检与环境证据。

```text
统一项目
→ 请求与项目验证
→ Asset Database 增量同步与缓存命中
→ 构建工具链 / 宿主能力预检
→ 资产内容寻址烘焙
→ Behavior Runtime 编译
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

## 诚实边界

- `windows-native` 是真实 Windows GUI EXE，不依赖 BAT 或 Node.js；但 v0.2 的渲染宿主仍使用 Windows 自带或已安装的 Edge/Chrome，而不是内嵌 Chromium/WebView2 Runtime。
- `android-apk` 已实现真实 Gradle 调用、产物检查、调试签名声明及可用时的 `apksigner` 验证；本发布环境没有 Android SDK/Gradle，因此发布样板只附 Android 工程，自动 APK 路径由隔离工具链测试验证。
- 正式商店 Android 发布仍需用户的 release keystore、AAB、商店元数据与真实设备矩阵。
- 原生 GPU、原生音频、增量补丁、自动更新和代码签名证书尚未完成。
