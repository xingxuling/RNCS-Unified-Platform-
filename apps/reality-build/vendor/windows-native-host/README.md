# Windows Native Host

v0.2 的 Windows Host 源码由 `src/native-host.mjs` 按构建请求确定性生成，并使用：

```text
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -H=windowsgui
```

应用内容以 Base64 常量嵌入 PE32+ GUI EXE。运行时释放至用户本地应用目录，再调用 Edge/Chrome App Mode；失败时使用 Windows MessageBox 和本地日志报告。
