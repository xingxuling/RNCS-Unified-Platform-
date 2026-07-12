# Changelog

## 0.1.0-alpha.5 — 2026-06-30

### Added

- `@vsr/observer-projection` 独立投影包；
- Observer Profile 与 Observer Policy v0.1；
- show / redact / hide 三态节点投影；
- 父策略向后代继承；
- 观察者决策预编译与缓存；
- Observer Projection Manifest；
- Multi-view Reality Invariant 等价验证；
- Reality One owner/operator/auditor/guest 预设；
- `evaluateForObserver()` / `evaluateForObservers()`；
- CLI `project-observer`；
- Studio 观察者切换；
- Observer Profile / Policy Draft 2020-12 Schema；
- 多观察者性能基准。

### Changed

- Runtime version 升级为 `0.1.0-alpha.5`；
- 投影哈希改为源 Display Hash + disclosure manifest 承诺；
- 可显示 DisplayItem 零复制复用；
- 普通观察者默认不继承权威诊断信息；
- Schema CLI 增加 observer-profile 与 observer-policy。

### Performance

- 1050 节点、4 观察者中位数从 87.70 ms 降至 8.59 ms；
- P95 10.88 ms；
- 单观察者折算中位数 2.15 ms。

### Verified

- 29/29 mechanism tests；
- 24/24 Studio controls；
- owner/operator/auditor/guest 四视图通过；
- mixed reality projection rejection 通过；
- CLI 和两份新 Schema 通过。

## 0.1.0-alpha.4 — 2026-06-30

### Added

- `RealityOneVSRSession` 持续投影会话；
- `reality-one.lifecycle-event.v0.1` 生命周期事件协议；
- 事件顺序、会话、前序根和哈希链校验；
- 确定性事件重放与重放清单；
- `VSRRuntimeSession` 实时变量、事件和上下文更新 API；
- CLI `replay-reality-one`；
- Reality One 生命周期 JSON Schema Draft 2020-12；
- Studio Reality One 实时演示、单步、自动回放、重置和快照导出；
- 桌面执行步骤双列布局；
- Reality One 实时事件性能基准。

### Changed

- `realityOneResultToVSR` 现在通过生命周期事件重放生成最终快照；
- Reality One 最终步骤由 Plan 与 Receipt 合并，不再只显示已回执步骤；
- Studio JSON 面板在实时模式显示当前快照，而不是初始模板；
- Schema CLI 支持 `--kind visual-ir|reality-one-lifecycle`。

### Verified

- 25/25 mechanism tests passed；
- 23/23 Studio controls wired；
- 10 事件完整重放通过；
- 桌面与移动快照、PNG、清单生成通过；
- 两次重放的事件链根、最终状态哈希和显示哈希一致；
- 实时事件求值中位数 0.63 ms，P95 1.62 ms。

## 0.1.0-alpha.3 — 2026-06-30

### Added

- `VSRProjectionSnapshot` 分支级布局与投影缓存；
- 祖先脏分支标记与整棵干净子树跳过；
- `item-manifest-v1` DisplayState 增量哈希；
- 稳定 DisplayItem 节点身份；
- `@vsr/adapter-reality-one` 最终结果适配；
- JSON Schema Draft 2020-12。

### Verified

- 21/21 tests passed；
- 18/18 Studio controls wired；
- 1000 节点增量中位数 5.04 ms；
- 平均跳过 903.3 / 1000 个投影节点。

## 0.1.0-alpha.2 — 2026-06-30

- 依赖图与节点级增量求值；
- Node 仿射光栅、Group clip、Path 子集、PNG 与确定性 bitmap font。

## 0.1.0-alpha.1 — 2026-06-30

- 首个 Minimum Executable Visual Runtime；
- Visual IR、确定性 Core、Canvas/Null、PNG/Video、Agent、CLI、Studio 与 RFE Adapter 闭环。
