# Requirements Architecture — Reality Network Runtime v0.1

## 原始目标与问题
现有母工程已具备 RSR v0.6 确定性空间模拟、VSR v0.5 投影、AAF/RBF/RFE/Gateway，但缺少多人输入、传输故障、客户端预测、权威确认和恢复闭环。目标不是“出现两个会动的角色”，而是证明两名玩家在真实网络队列和故障注入下仍由同一 RSR 世界裁决并最终收敛。

## 需求来源
- 用户任务：固定版本、目录、协议、Gateway 动作、20 项强制测试和双 ZIP 交付。
- 代码事实：`packages/world/reality-simulation-runtime/packages/spatial-embodiment/src/index.ts` 提供 `SpatialEmbodimentWorld.step/snapshot/fromSnapshot` 与碰撞 State Root。
- 代码事实：AAF 提供 sealed delegation；RBF 提供 workspace/candidate branch；RFE SDK 提供稳定 canonical hash；Gateway 提供 manifest discovery/invoke。

## 目标—结果—能力—交互—技术链
- 目标：形成 RNCS 多人网络同步最小闭环。
- 结果：两个玩家在 60 Tick、20% 丢包、乱序、重复和重连后得到相同权威 Root；非法控制被拒绝且有收据。
- 能力：权威 Tick、协议 Schema、预测、回滚重演、插值、故障模拟、授权、证据、恢复候选分支、Gateway。
- 交互：Node/浏览器双人 Loopback 演示可调延迟、抖动、丢包和断线。
- 技术：Node >=20、ESM workspace、无公网依赖、固定种子、公开契约集成。

## 硬约束、偏好、假设与未知
### 硬约束
- 新包版本 `0.1.0-alpha.1`；协议 `rncs.network-runtime.v0.1`；runtime id `rncs.network`。
- 不复制 RSR/VSR/AAF/RBF/RFE 源码，不把网络逻辑写入 RSR/VSR。
- 客户端只提交输入；服务器唯一写正式世界状态。
- 20 个指定测试与受影响旧测试不得跳过。

### 软约束
- 第一版支持 2/10/50 人协议与队列开销测量，不承诺公网匹配或 MMO 规模。
- 演示优先调试投影，不追求正式美术。

### 假设
- 单进程 Loopback 足以验证协议、权威和故障模型；公网 NAT、DDoS、跨区域迁移不在本轮。
- AAF delegation 是本轮角色控制授权的最小公开契约。

### 未知
- 生产环境加密传输、密钥轮换、跨服一致性和长期持久化策略需后续版本验证。

## 优先级与依赖
P0：唯一权威、授权、幂等输入、固定 Tick、Snapshot/Delta、预测回滚、收据、20 项测试。
P1：浏览器调试投影、性能基准、Gateway 集成、跨平台脚本。
P2：公网传输、匹配、持久化、加密和大规模分片。

## 验收场景与证据
每个场景采用“给定—当—那么—异常”并由 `packages/network/reality-network-runtime/tests/network-runtime.test.mjs` 自动执行：
1. 双玩家 60 Tick 权威 Root 唯一且一致。
2. 预测在 Ack 后收敛。
3. 20% 丢包最终收敛。
4. 乱序包不倒退服务器 Tick。
5. 重复序列只执行一次。
6. 玩家 A 控制 B 被拒绝。
7. 过期 delegation 被拒绝。
8. 晚加入取得完整快照。
9. 重连后保留并重发未确认输入。
10. 错误预测触发快照恢复和重演。
11. 插值不改变权威 Root。
12. 严重失同步生成 RBF `network-recovery` candidate。
13. 网络收据可确定性重放。
14. 相同输入与种子产生相同 Root。
15. Gateway 发现并调用 `rncs.network`。
16. 客户端直接提交位置被拒绝。
17. Tick 窗口外输入被拒绝。
18. 突发丢包恢复不双重执行。
19. Session 关闭后旧授权失效。
20. 网络模块只持有一个 RSR 权威实例，客户端均为预测副本。

## 冲突与裁决
- 丢包可能使单次输入消失：客户端保留未确认队列并周期重发；服务器幂等去重。
- 完整快照体积较大：首次加入/重连/严重失同步使用快照，正常 Tick 使用 Delta。
- 预测 Root 与服务器 Root短暂不同：允许暂时偏离，但 Ack 后必须重放并收敛。

## 非目标与延期项
公网匹配、UDP/QUIC、跨区域服务器迁移、反作弊机器学习、账号系统、资产经济、正式 VSR 渲染和生产级加密不属于 v0.1。

## 变更记录
- 2026-07-03：首次编译；以用户指定 20 项测试作为不可降级验收基线。
