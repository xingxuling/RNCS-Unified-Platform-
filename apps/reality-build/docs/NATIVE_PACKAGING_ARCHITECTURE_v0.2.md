# 原生包装架构 v0.2

## Windows

```text
Unified Project
→ inline HTML runtime
→ Base64 payload
→ generated Go host source
→ GOOS=windows / GOARCH=amd64
→ PE32+ windowsgui EXE
```

运行时：

1. EXE 解码内嵌应用；
2. 写入 `%LOCALAPPDATA%/RealityBuild/<app-id>/<build-id>/app.html`；
3. 优先调用 Edge，再调用 Chrome App Mode；
4. 浏览器不可用时调用默认文件处理器；
5. 启动失败时写日志并显示 Windows MessageBox。

这消除了 BAT、命令行乱码和 Node.js 依赖，但仍没有把浏览器内核静态塞进 EXE。

## Android

```text
Unified Project
→ inline HTML runtime
→ generated Java WebView host
→ Gradle assembleDebug
→ debug keystore signing
→ APK structure / signature verification
```

调试签名适合直接安装与验收，不等于 Google Play 正式发布签名。
