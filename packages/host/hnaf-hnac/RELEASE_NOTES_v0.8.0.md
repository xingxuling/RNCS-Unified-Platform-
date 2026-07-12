# HNAC / HNAF v0.8.0 发布说明

## 发布主题

**远程能力不是“调一个 API”，而是让一个外部行动者在明确权威、沙盒和证据边界内改变现实。**

v0.7 已经解决“界面意图如何发现能力并先授权整条备用链”。v0.8 进一步解决：Provider 在本机、网络、进程或 Gateway 中真正执行时，如何避免重复执行、无限等待、资源失控、供应链替换和无证据提交。

## 关键交付

1. Remote Execution Fabric 0.8；
2. Provider Ed25519 供应链签名；
3. HTTP / WebSocket / stdio / local-process / Gateway transport；
4. 超时、取消、幂等、重试、熔断与资源配额；
5. RNCS Envelope 与 RFE Generation 提交；
6. PWA 远程 Provider 宿主；
7. Pocket v0.5 Android 原生桥源码边界；
8. 54 项回归测试与发布证据。

## 不包含

- 互联网规模 Provider 市场、计费和信誉网络；
- 容器编排与弹性集群；
- Windows/macOS/iOS 完整原生沙盒实现；
- Android 正式 APK 重签；
- 工业、汽车、医疗级实时与功能安全认证。
