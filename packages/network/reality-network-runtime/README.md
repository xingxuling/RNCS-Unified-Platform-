# Reality Network Runtime v0.2.0-alpha.1

网络运行时现在直接复用 RSR v0.7 权威状态协议：

- `rsr.authoritative-state.v0.7` 完整快照与增量；
- 基线不匹配增量隔离，等待完整快照恢复；
- AAF delegation、客户端预测、重演、丢包与乱序故障注入；
- VSR v0.6 可直接消费网络权威包进行时间投影；
- RFE 网络证据、RBF 恢复候选与 Gateway v0.3 调用。

```bash
npm test --workspace @taowind/reality-network-runtime
npm run benchmark --workspace @taowind/reality-network-runtime
npm run demo:network
```
