# HNAF Pocket v0.4 能力绑定源码接入资产

本目录在 v0.3 自适应界面宿主基础上加入 HNAC/AIP v0.7 接入边界：

- 验证 HNAC `format_version: 0.7`；
- 接受 AIP v0.6 / v0.7 图；
- 保留 Phone / Tablet / Accessibility 投影和语义快照；
- v0.7 意图通过 `hnaf-action://capability-intent` 交给 Android 原生能力桥；
- 原生侧应连接 Reality One Gateway、CNP、AAF，并把执行回执返回 WebView；
- 高风险能力必须由原生界面显式确认，不能由网页静默批准。

## 签名边界

当前已安装的 `HNAF-Pocket-v0.2.2-signature-hotfix.apk` 只携带证书公钥，不包含原始私钥。正式 v0.4 APK 必须回到原 Android 工程，并用原 Hotfix keystore 构建签名，才能覆盖安装并保持应用身份连续性。

原证书 SHA-256：

`7B:26:24:9E:14:9C:6D:52:9E:96:31:19:A3:C4:A4:8F:6E:7C:B1:84:28:C7:C4:64:56:FF:85:E8:B0:3A:DA:AC`
