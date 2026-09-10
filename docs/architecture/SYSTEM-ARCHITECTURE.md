# System Architecture — Reality Network Runtime v0.1

## 系统目标与不变量
- 任意时刻每个 Session 只有一个 `ServerAuthoritativeWorld.rsrWorld` 正式写入者。
- `(playerId,inputSequence)` 至多执行一次。
- 服务器 Tick 单调递增，乱序包不能使其倒退。
- 预测、插值和外推不得修改服务器 RSR 实例。
- 相同输入与相同网络种子产生相同最终 Root。

## 系统边界与环境
系统内：Session 生命周期、输入校验、固定 Tick、Loopback 故障队列、预测/回滚、Snapshot/Delta、Receipt、checkpoint 候选恢复、Node-only checkpoint store candidate、RBF 恢复候选、Gateway bridge。
外部 Provider：RSR 物理、AAF delegation、RBF candidate、RFE hashing/evidence、VSR 可选正式投影。
环境：浏览器键盘、Node 进程、操作系统定时器；所有入站数据默认不可信。

## 子系统职责
- `ServerAuthoritativeWorld`：授权、幂等、Tick 队列、RSR step、快照/增量/收据。
- `ClientPredictionRuntime`：未确认输入、预测快照、Ack、恢复、重演和 correction receipt。
- `LoopbackTransport`：确定性传输时序。
- `NetworkConditionSimulator`：延迟、抖动、丢包、重复、乱序、断线、带宽和 burst loss。
- `SnapshotInterpolator`：远端视觉投影。
- `RealityNetworkRuntime`：公开 Session API 和 Gateway 动作。

## 控制、数据与执行平面
- 控制面：create/join/disconnect/reconnect/close/getHealth/recovery。
- 数据面：input/snapshot/delta/ack/correction/receipt。
- 执行面：服务器将已接受输入翻译成 RSR `SpatialCommand` 并调用 `world.step()`。

## 状态与权威模型
强权威：Session 状态、服务器 Tick、RSR Snapshot、State Root、输入消费记录。
最终一致：客户端预测副本、远端插值缓存、网络统计。
候选状态：RBF recovery workspace/branch；验证通过前不得替换正式 Session。

## 关键闭环与时序
1. 客户端本地预测并发送 input。
2. Transport 按确定性网络条件投递。
3. 服务器核验 delegation、角色归属、序列和 Tick 窗口。
4. 固定 Tick 调用唯一 RSR 世界。
5. 服务器发 Ack + Delta；必要时发完整 Snapshot。
6. 客户端删除已确认输入，以权威 Snapshot 为基线重演剩余输入。
7. 无未确认输入时，客户端 Root 必须等于服务器 Root。

## 故障域、降级与恢复
- 丢包：重发未确认输入；幂等去重。
- 乱序/重复：按 Tick/序列拒绝倒退和双重执行。
- 短时断线：客户端保留队列；重连取得完整快照并重发。
- 严重失同步：创建隔离的 RBF `network-recovery` candidate，重放成功才恢复。
- 进程退出/迁移候选：`network.session-checkpoint.v0.1` 保存经过 RFE 根封存的 RSR snapshot、玩家/AAF delegation、未消费输入、幂等序列、收据和有限 history；新 Runtime 通过 `SpatialEmbodimentWorld.fromSnapshot()` 恢复，验证失败则拒绝载入。
- 文件恢复候选：Node-only `NetworkSessionCheckpointStore` 复用 `rncs-durable-store` 的临时文件同步、原子 rename、目录同步、主文件优先和故障注入；恢复后仍须由 Network Runtime 验证 checkpoint，存储 provider 不写入 canonical world state。
- 带宽限制：优先 Ack/Receipt；正常使用 Delta，必要时回退完整 Snapshot。

## 外部 Provider 契约
- RSR：`SpatialEmbodimentWorld.step/snapshot/fromSnapshot`。
- Checkpoint：Network Runtime 只拥有会话封存/恢复编排；RSR 仍拥有空间状态快照和状态根，不复制物理状态语义。
- AAF：`sealDelegation/verifyDelegation` 与 delegation root。
- RFE：`rootHash/withIntegrity`。
- RBF：`createBranch/createWorkspace/validateWorkspace`。
- Durable store：`AtomicJsonStore` 只负责已验证 candidate artifact 的文件原子写入与恢复；调用方负责 schema、root、receipt 和 authority。
- Gateway：runtime manifest + node-module bridge。

## 演化与兼容策略
协议对象均有 `format` 和版本；checkpoint 候选只新增 Network Runtime 包，不改 RSR/VSR。未来 UDP/QUIC 传输实现同一 Transport 接口；旧 Loopback 继续作为确定性测试 Provider。文件原子存储现在有本地 Node candidate seam，但实际断电、WAN/TLS、跨节点租约与 failover 不由该候选暗示为已完成。

## 最小系统验证
`npm test --workspace @taowind/reality-network-runtime` 覆盖 30 个场景；`npm test --workspace @taowind/rncs-durable-store` 覆盖共享原子存储；`npm run demo:network` 启动双人运行；Gateway 测试发现 `rncs.network` 并调用健康与 Session 动作。
