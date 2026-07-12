# Reality Architecture — Reality Network Runtime v0.1

## 目标现实变化
玩家在有效 Session 和授权范围内提交“移动/跳跃/推动”意图，权威服务器在固定 Tick 中让 RSR 世界从状态 A 变成状态 B；服务器快照、State Root 和网络收据证明该变化成立。

## 主体与角色
- 玩家/Subject：产生输入意图并承担该角色操作责任。
- Client A/B：预测与展示代理，不是事实确认者。
- 权威服务器：唯一世界事实确认者与正式写入者。
- AAF：确认 Subject、Player、角色和动作范围的委托有效性。
- RSR：执行碰撞、运动、推动箱子和世界 State Root。
- RBF：严重失同步时承载隔离的恢复候选。
- RFE：承载 Tick 与关键事件证据对象。
- Gateway/管理员：发现、健康检查和显式 Session 生命周期；客户端不得伪造管理员动作。

## 持续对象与投影
持续对象是 Session、Player、Character、RSR World、Input、Snapshot、Receipt 和 Recovery Candidate。浏览器画面、Ping 数字、插值坐标只是投影，不是正式对象本身。

## 权利、责任与委托
- 玩家只能控制 delegation 中绑定的 `subject_id/player_id/character_id/session_id`。
- 服务器可接受或拒绝输入，必须为拒绝产生 `NetworkInputRejectionReceipt`。
- Session 关闭后 delegation 即使未到时间也失效。
- 管理动作（关闭、恢复、迁移）只能通过服务器/Gateway 入口执行。

## 状态机与事件
```text
created → open → disconnected/recovering → open → closed
                 ↘ recovery-failed（主 Session 不变）
```
关键事件：join、leave、input-accepted/rejected、rollback、replay、desync、disconnect/reconnect、session-close。

## 资源、时间和空间约束
- 60 Tick/s；输入只在允许的过去/未来窗口内生效。
- 传输可丢失、重复、乱序、限带宽或暂时中断。
- 测试场含两名角色、一个动态箱子、静态地面和斜/旋转障碍；碰撞由 RSR v0.6 处理。

## 证据与事实确认
每个权威 Tick 生成 `serverStateRoot/acceptedInputRoot/rejectedInputRoot/snapshotRoot/deltaRoot/networkReceiptRoot/previousTickRoot`。关键事件转成 `rfe.network-evidence.v0.1`；恢复候选包含最后可信快照、输入和收据 Root。

## 风险与不可逆点
错误授权、重复输入、客户端伪造状态、恢复污染主世界和 Session 关闭后的旧授权复用均为硬拒绝。v0.1 没有现实资产交易，因此世界运动本身可由可信快照恢复。

## 当前伪边界
- 客户端坐标不是世界事实。
- UI 中显示“同步”不等于 Root 已验证。
- 收到数据包不等于输入已被权威消费；只有 Ack/Receipt 才能确认。
- 网络缓存不是第二份正式世界状态。

## 最小现实闭环
真实玩家意图 → AAF delegation 核验 → 服务器输入队列 → RSR 碰撞/运动 → 权威 Snapshot/Root → 客户端校正 → Receipt/Evidence → 可重复测试证明。
