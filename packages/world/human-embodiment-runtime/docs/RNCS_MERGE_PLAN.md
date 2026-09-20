# RNCS Merge Plan — HER v0.3

建议 RNCS 将本包作为独立 runtime 器官接入，而不是并入 VSR 或 RSR 内部。

## Runtime identity

- `runtime_id`: `rncs.human-embodiment`
- `version`: `0.3.0-alpha.1`
- priority: 86
- optional requires: RSR >=0.7 <0.10; VSR >=0.7 <0.9

## Control-plane

将 `rcl/human_embodiment.rcl` 加入 RNCS RCL control-plane module graph，并使 runtime registry / gateway 可发现该 runtime。

## Provider surfaces

- HER → RSR: `rsr.spatial-embodiment.v0.6`
- HER → VSR: `vsr.spatial-reality-3d.v0.7`
- HER → VSR temporal: `vsr.temporal-presentation.v0.6`
- HER → World Body IR: `rncs.world-body-ir.human.v0.3`

## Non-goals

- 不把 Babylon.js / Three.js 写死为核心依赖；
- 不让 VSR 决定人体动作语义；
- 不让 RSR 承担骨骼动画编辑逻辑；
- 不把万风动作定义硬编码进 HER Core。
