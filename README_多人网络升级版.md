# RNCS Aetherworld Unified v0.5.0-alpha.1 多人网络升级版

本版在 v0.4.0-alpha.1（RSR v0.6 / VSR v0.5）基础上新增 Reality Network Runtime v0.1.0-alpha.1：

- `runtime_id: rncs.network`
- `protocol: rncs.network-runtime.v0.1`
- 权威服务器固定 Tick
- AAF 兼容授权
- RSR 唯一正式世界状态
- Snapshot / Delta / Ack / Correction / Receipt / Recovery
- 客户端预测、回滚和未确认输入重演
- 确定性 Loopback 网络故障注入
- RBF 恢复候选与 RFE 网络证据
- Gateway 发现和调用
- 双人浏览器调试演示

## 安装与验收

```bash
npm install
npm run test:network
npm run test:gateway
npm run test:integration
npm run benchmark:network
npm run demo:network
```

浏览器打开 `http://127.0.0.1:8787`。
