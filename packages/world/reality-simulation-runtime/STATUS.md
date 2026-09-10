# RSR Status

- 当前版本：`0.9.0-alpha.1`
- Spatial Embodiment：70/70 PASS（含 RAGF embodiment profile materialization/replay、bounded heightfield candidate 与 managed static residency transition）
- RSR全量：204/204 PASS（含 v0.7 network 7/7）
- Entity Kernel -> RSR -> VSR bridge：3/3 integration PASS
- Aether Reality Cell -> RSR/Network/VSR bridge：22/22 integration PASS
- Reality Cell -> VSR asset streaming resolution：dependency/resident/queued/evicted roots PASS；真实 Chromium frame root match PASS
- 精确Capsule–OBB：PASS
- 摩擦Warm Start：PASS
- Constraint Island / Island Sleep：PASS
- Coyote Time / Jump Buffer：PASS
- RSR v0.7 Network Authority Protocol：兼容
- Convex Hull fixture：非共面顶点校验、GJK/EPA 接触、VSR 三角网格投影：PASS
- Heightfield fixture candidate：固定点采样、斜坡支撑法线、Kernel lowering、VSR 网格与确定性重放：PASS；Large World -> RSR candidate lowering 与同世界 managed static terrain enter/exit transition：PASS；完整接触流形与目标设备证据：OPEN
- `rncs.entity-state-batch.v0.1` -> authority body/fixture -> VSR scene/frame/pixel roots：PASS
- RAGF `ragf.rsr-embodiment-profile.v0.4` -> fixed-point dynamic body/character controller：PASS；profile root 与 materialization root 均参与验证
