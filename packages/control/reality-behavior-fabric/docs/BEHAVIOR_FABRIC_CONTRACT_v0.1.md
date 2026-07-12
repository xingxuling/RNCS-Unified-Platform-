# Reality Behavior Fabric Contract v0.1

## 1. 确定性

相同 Program Root、初始状态、输入日志、Provider 结果和 Tick 顺序，必须产生相同 State Root。

禁止在权威行为路径中使用：

- `Math.random()`；
- 系统时间作为逻辑输入；
- 未记录的网络结果；
- `eval` 或动态函数构造；
- 不稳定对象枚举顺序。

## 2. 事件顺序

事件按以下键排序：

1. Phase：input → pre → simulation → post → evidence；
2. Priority：高到低；
3. Sequence：小到大。

每 Tick 有最大事件预算，超过预算必须失败，禁止静默进入无限循环。

## 3. 状态迁移

- Rule、State Machine 和 Behavior Tree 只能通过 Action 产生变化；
- Capability Call 必须经过 Authority Resolver；
- 需要审批的动作只生成 Proposal，不得直接执行；
- 每次 Tick 结束生成稳定 State Root。

## 4. 热更新

热更新可以保留：

- 同 ID 实体的变量和组件；
- 新程序中仍存在的状态机当前状态；
- 输入与命令日志；
- 世界 Tick 和全局状态。

已被删除的状态、树内存和不兼容结构必须安全回退。

## 5. 快照与重放

Snapshot 必须包含：

- Program Root；
- Runtime State；
- PRNG State；
- Event Bus Queue 与 Scheduled Events；
- Trace 边界。

## 6. 适配边界

RBF 负责决定“发生什么”，但不直接承担：

- 物理求解；
- 最终动画、音频与特效执行；
- GPU 渲染；
- 宿主通知、支付和平台 SDK。

这些能力通过 Capability 与适配器交给 RSR、VSR、Gateway 或宿主。
