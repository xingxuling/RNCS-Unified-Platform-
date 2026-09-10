# Reality Network Runtime v0.2.0-alpha.1

网络运行时现在直接复用 RSR v0.7 权威状态协议：

- `rsr.authoritative-state.v0.7` 完整快照与增量；
- 基线不匹配增量隔离，等待完整快照恢复；
- AAF delegation、客户端预测、重演、丢包与乱序故障注入；
- VSR v0.6 可直接消费网络权威包进行时间投影；
- Iris 风格 Observer Relevance View：按空间半径、语义标签、因果/焦点主体和对象预算生成确定性观察者视图；视图只读，不改变 RSR 权威快照；
- RFE 网络证据、RBF 恢复候选与 Gateway v0.3 调用。
- `network.session-checkpoint.v0.1` 候选：复用 RSR `SpatialEmbodimentWorld.fromSnapshot()`、玩家绑定、AAF delegation、未消费输入、幂等序列、收据和有限 authority history，在新 Runtime/Node 进程边界恢复同一 State Root；checkpoint 只有完整性根，不授予 commit 或生产恢复权。
- Node-only `@taowind/reality-network-runtime/node` 暴露 `NetworkSessionCheckpointStore`，复用共享 `@taowind/rncs-durable-store` 的临时文件同步、原子 rename、目录同步、主文件优先恢复和故障注入；Network 自己仍负责 checkpoint 验证、语义 receipt 与 authority 边界。

```bash
npm test --workspace @taowind/reality-network-runtime
npm run benchmark --workspace @taowind/reality-network-runtime
npm run demo:network
```

观察者相关性入口：`pullObserverView({ sessionId, observerId, position, radius, semanticTags, causalBodyIds, focusBodyIds, maxObjects })`。
它返回 `sourceStateRoot`、`authorityFrameRoot`、选中对象、优先级和 `viewRoot`；这是复制/呈现前的相关性合同，不是客户端权威状态替代品。

会话候选恢复入口：

```js
const checkpoint = runtime.createCheckpoint({sessionId});
const recovered = new RealityNetworkRuntime();
await recovered.createSessionFromCheckpoint({checkpoint});
```

持久化候选入口（仅 Node 环境）：

```js
import {NetworkSessionCheckpointStore} from '@taowind/reality-network-runtime/node';

const store = new NetworkSessionCheckpointStore({filePath: '/absolute/path/session.json'});
await store.save(checkpoint);
const {checkpoint: restored, receipt} = await store.recover();
```

这条路径已用序列化 JSON、独立 Node 进程、临时文件同步/原子 rename、主文件优先和注入式故障恢复验证；它仍不是实际断电、WAN failover、TLS、跨节点 leader 选举、密钥托管或生产会话恢复证明。共享存储只提供候选 artifact 持久化能力，不授予 canonical state 写权限。带 Studio Network Compilation 的 checkpoint 只保存 source roots，恢复时必须重新提供并验证原始 compilation。
