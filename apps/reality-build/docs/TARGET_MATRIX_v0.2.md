# Reality Build Target Matrix v0.2

| Target | Build-time requirement | Runtime requirement | Output | Evidence |
|---|---|---|---|---|
| web-release | Node.js | Modern browser / web server | PWA folder | file hashes + target root |
| web-single | Node.js | Modern browser | one HTML | embedded payload + target root |
| windows-portable | Node.js | Windows + Edge/Chrome | HTML + BAT | compatibility manifest |
| windows-native | Node.js + Go | Windows 10/11 + Edge/Chrome | PE32+ GUI EXE | executable SHA-256 + PE test |
| android-project | Node.js | Android Studio/Gradle to compile | complete project | project manifest |
| android-apk | Node.js + JDK + Gradle + Android SDK 35 | Android 7.0+ | debug-signed APK | APK SHA-256 + signature status |
| headless-server | Node.js | Node.js 20+ plus Reality Studio package | HTTP headless runtime folder | server manifest + runtime replay |
| replay-bundle | Node.js | Node.js 20+ plus Reality Studio package | project + replay verifier | evidence, timeline and replay roots |

Every build also emits root-level behavior evidence plus
spatial-snapshot.json, spatial-causal-delta.json, and
spatial-runtime.manifest.json. Projects with an active TileMap additionally
emit tilemap-navigation.manifest.json. File-based targets copy the same
artifacts so a client package, headless runtime, and replay bundle can be
checked against one deterministic build identity.

## 选择原则

- 给普通 Windows 用户：优先 `windows-native`。
- 需要完全浏览器兼容：保留 `windows-portable`。
- 给开发人员继续修改 Android：选择 `android-project`。
- 构建机工具链齐全并需要直接安装：选择 `android-apk`。
