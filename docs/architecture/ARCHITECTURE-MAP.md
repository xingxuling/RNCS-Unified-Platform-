# Architecture Map — Reality Network Runtime v0.1

## 当前目标
在统一母工程中新增 `packages/network/reality-network-runtime/`，让两个客户端通过真实 Loopback 传输向唯一权威 RSR v0.6 世界提交输入，并在延迟、抖动、丢包、重复、乱序和短时断线后收敛到同一 State Root。

## 主 Skill
`architecture-v3-system`。主裁决对象是权威边界、固定 Tick、输入/快照/收据闭环、一致性、故障域和恢复。

## 辅助 Skill 与调用顺序
1. `architecture-v6-requirements`：把任务编译为 20 个可重复验收场景及性能阈值。
2. `architecture-v2-reality`：确定玩家只拥有输入意图，服务器确认世界事实；管理员动作不得由客户端伪造。
3. `architecture-v3-system`：裁决单点世界权威、最终收敛、故障隔离和恢复候选分支。
4. `architecture-v1-software`：把裁决落到包、公开接口、Gateway bridge、测试和脚本。

## 各 Skill 输入和输出
- V6 输入：用户硬约束、现有包版本、20 项测试；输出：`REQUIREMENTS-ARCHITECTURE.md`。
- V2 输入：玩家、Subject、服务器、Agent、管理员及授权关系；输出：`REALITY-ARCHITECTURE.md`。
- V3 输入：RSR/AAF/RBF/RFE/Gateway 公开契约与网络故障模型；输出：`SYSTEM-ARCHITECTURE.md`。
- V1 输入：上述裁决及真实源码；输出：`SOFTWARE-ARCHITECTURE.md` 与实现。

## 现实硬约束
- 客户端不能写位置、速度、碰撞结果或正式 State Root。
- RSR v0.6 的 `SpatialEmbodimentWorld` 是唯一世界状态权威；网络包只保存快照、缓存和投影。
- 输入必须绑定 Subject、Player、Session、角色控制权和 AAF delegation root。
- 恢复失败不得污染正式 Session。
- 测试必须在本机、固定随机种子下可重复，不依赖公网。

## 跨层依赖
`ClientPredictionRuntime → LoopbackTransport → ServerAuthoritativeWorld → RSR`；授权使用 AAF 公开 delegation 契约；证据 root 使用 RFE Core SDK；严重失同步使用 RBF 公开 workspace/branch 契约；Gateway 只通过 runtime manifest 和 bridge 调用公开入口。

## 冲突与裁决
- “即时手感”与“世界权威”冲突：客户端可预测，但服务器 State Root 永远优先。
- “恢复速度”与“证据完整”冲突：允许完整快照恢复，但必须保留 Correction/Recovery Receipt。
- “网络容错”与“重复执行”冲突：输入按 `(playerId,inputSequence)` 幂等消费。
- “视觉平滑”与“正式状态”冲突：插值/有限外推只产生 projection，不回写 RSR。

## 暂不处理的层
不调用 V4、V5、V7、V8、V9：本轮不重定义产品、商业、正式交互/美术或元架构，也不创建平行世界内核。

## 最小验证闭环
```text
客户端输入
→ 主体与授权检查
→ 网络输入队列
→ 权威服务器 Tick
→ RSR 执行世界变化
→ Snapshot/Delta
→ 客户端预测与重演
→ State Root 收敛
→ RFE 兼容网络收据
→ Gateway 健康检查
```
