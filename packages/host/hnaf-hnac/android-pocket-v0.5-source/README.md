# HNAF Pocket v0.5 远程能力桥源码接入资产

本目录在 v0.4 能力绑定宿主基础上加入 HNAC v0.8 远程执行边界：

- 验证 HNAC `format_version: 0.8`，并继续兼容 0.1–0.7；
- 接受 AIP v0.6 / v0.7 图；
- 保留 Phone / Tablet / Accessibility 投影与语义快照；
- v0.7 意图继续通过 `hnaf-action://capability-intent` 交给原生桥；
- v0.8 意图通过 `hnaf-action://remote-execution-intent` 交给 Android 原生执行织构；
- 原生桥必须验证 Provider Ed25519 供应链签名，再连接 Gateway/CNP/AAF；
- HTTP、WebSocket、stdio、本地进程及设备 Provider 必须受网络白名单、可执行文件白名单、超时、取消、幂等、熔断与资源配额约束；
- 高风险能力必须由原生界面显式确认；
- 成功执行回执应由原生侧提交到 RFE Generation，WebView 不拥有权威提交权限。

## Android 原生桥最小回传格式

```json
{
  "ok": true,
  "receipt": {
    "format": "hnaf.intent-execution-receipt.v0.8",
    "status": "executed",
    "receipt_root": "...",
    "rfe_commit": {"status": "committed"}
  }
}
```

## 签名边界

当前已安装的 `HNAF-Pocket-v0.2.2-signature-hotfix.apk` 只携带证书公钥，不包含原始私钥。正式 v0.5 APK 必须回到原 Android 工程，并用原 Hotfix keystore 构建签名，才能覆盖安装并保持应用身份连续性。

原证书 SHA-256：

`7B:26:24:9E:14:9C:6D:52:9E:96:31:19:A3:C4:A4:8F:6E:7C:B1:84:28:C7:C4:64:56:FF:85:E8:B0:3A:DA:AC`
