# Software Architecture — Reality Network Runtime v0.1

## 软件目标与质量属性
在 Node >=20 ESM workspace 中提供可重复、可测试、可打包的多人网络运行时。质量属性：确定性、单一状态权威、幂等、故障可注入、无公网依赖、零额外生产依赖、2/10/50 玩家可测量。

## 当前执行链
现有正式物理链位于 `packages/world/reality-simulation-runtime/packages/spatial-embodiment/src/index.ts`：配置 → `SpatialEmbodimentWorld.step()` → 碰撞/角色控制 → `snapshot()` → `stateRoot`。新网络包只在其外部增加输入队列、传输与预测。

## 模块与接口
- `src/protocol.mjs`：协议对象、Delta、RFE evidence。
- `src/authority.mjs`：AAF delegation 创建与校验。
- `src/transport.mjs`：确定性网络故障模拟。
- `src/server.mjs`：唯一权威世界与 Tick。
- `src/client.mjs`：预测、Ack、回滚、重演。
- `src/interpolation.mjs`：视觉缓冲/外推/传送检测。
- `src/runtime.mjs`：公开 Gateway/应用 API。
- `src/index.mjs`：稳定导出面。

## 数据所有权
- `ServerAuthoritativeWorld.rsrWorld` 独占正式 RSR 状态。
- 服务器拥有输入消费集、Tick receipts、正式 Snapshot/Delta。
- 客户端拥有未确认队列和预测 RSR 副本；不可回写服务器。
- Interpolator 只拥有投影样本。

## 运行时与部署拓扑
v0.1 默认单 Node 进程：权威服务器、Client A、Client B 和 Loopback transport；浏览器仅通过本地 HTTP 发送控制并读取调试投影。未来可替换 Transport，不改变协议与服务器 API。

## 错误和恢复模型
所有输入拒绝返回结构化 code 和 sealed receipt。预测错误从最后服务器 Snapshot 恢复并重演；严重失同步创建 RBF candidate。Session close 清空可接受入口但保留只读证据。

## 备选方案比较
### 方案 A：网络包内部实现轻量运动
优点：简单；缺点：制造第二套世界权威、不能证明 RSR 碰撞闭环。拒绝。
### 方案 B：RSR 唯一权威 + 客户端 RSR 预测副本（采用）
优点：正式 Root 来自现有 RSR；预测可确定性重演；不侵入 RSR。成本是客户端需要同版本 RSR。
### 方案 C：把网络逻辑写入 RSR
优点：调用少；缺点：污染物理运行时、破坏依赖方向。拒绝。

## 迁移切片
1. 新增独立包与协议 Schema。
2. 先跑单玩家权威输入与快照。
3. 加入第二玩家、授权和幂等。
4. 加入传输故障、预测/回滚。
5. 加入 RBF/RFE/Gateway。
6. 加入浏览器调试投影、性能与发布证据。

## 测试与性能预算
20 项网络自动化测试；重跑 RSR、VSR、Gateway、统一集成与受影响模块。性能脚本测 2/10/50 玩家、Snapshot/Delta、哈希、重演和 20% 丢包收敛 Tick。

## 已知债务与删除清单
- v0.1 未实现真实 UDP/QUIC、加密和跨进程持久化。
- 不新增 RSR/VSR 状态结构，不复制 AAF/RBF/RFE 源码。
- 后续版本应把浏览器客户端预测迁移到共享 Web Worker/WASM，而不是复制规则。
