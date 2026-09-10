# RSR v0.9.0-alpha.1 Release Notes

## Working-tree candidate（不改变版本号，不代表 release promotion）

- 在 `e0214c3` 增加 bounded `heightfield` fixture：固定点毫米采样、未旋转静态/运动学 provider、三角插值支撑法线、单支撑点碰撞、Kernel lowering、快照/重放与 VSR 网格投影。
- 新增 candidate-only `replaceManagedStaticBodies(...)`：按受管理标签对静态物理体做确定性 enter/exit/retain 切换，切换前原子校验，切换后清除失效接触/支撑缓存并保留非管理动态体；输出独立 `rsr.spatial-body-residency-transition.v0.1` 根。
- 新增 bounded fixed-point heightfield surface ray query：对未旋转 heightfield 做 XZ bounded clip、网格 traversing 与 authored triangle intersection，返回表面交点和 upward normal；shape cast、动态地形与完整接触流形仍保持 OPEN。
- 新增 bounded heightfield sphere/upright-capsule support probe：复用 authored triangle surface，固定步进加二分细化首个 sampled contact；unsupported box/convex 等类型 fail closed。它仍不是 exact swept shape cast 或完整接触流形。
- 新增 bounded heightfield sphere-vs-authored-triangle sweep：对 face、edge、vertex 候选做确定性固定点求交，按投影 XZ cell window 和 `4096` cell 上限 fail closed；sphere 走 exact local sweep，upright capsule 仍保留 support probe，box/convex 等类型继续拒绝。
- Spatial Embodiment 回归为 `72/72 PASS`，RSR 全量回归为 `206/206 PASS`；Large World -> RSR terrain lowering、同一 RSR 世界的 stream residency transition、bounded terrain-surface ray query、sphere sweep 与 capsule shape-probe 已有本地 candidate execution evidence，但不宣称完成生产级 stream policy、exact capsule sweep、完整工业接触流形、真实设备或生产性能。

- Added authored convex-hull fixtures with finite, non-coplanar vertex validation and deterministic triangle-index validation.
- Routed convex-hull fixtures through rotated world-space support points, GJK/EPA contacts, broad-phase AABBs, snapshots, replay roots and VSR triangle-mesh projection.
- Added regression coverage for rotated hull-hull contact, separated hulls and authored geometry preservation: Spatial Embodiment `63/63 PASS`.
- Added the `rncs.entity-state-batch.v0.1` to RSR authority body/fixture materializer and the deterministic RSR snapshot to VSR scene/frame/pixel projection path; Aether bridge integration `3/3 PASS`, including sealed-batch tamper rejection.

# RSR v0.6.0-alpha.1 Release Notes

- Rotated box fixtures now use oriented bounds.
- Sphere-to-box collision uses closest point on OBB.
- Box-to-box narrow phase uses deterministic 15-axis SAT.
- Fixture local offsets rotate with the owning body.
- Added regression coverage for rotated contacts and deterministic replay.

# RSR v0.5.0-alpha.1 Release Notes

## 主题

**三维具身动力学：把身体运动、空间接触和多感官反馈统一成可重放、可恢复、可投影的现实状态。**

## 主要新增

- 三维 Sphere、Box、Capsule；
- 三维刚体位置、速度、旋转与角速度；
- 地面、Grounded、Sleep、Sensor、Mask 和 Bullet 微步；
- 角色移动、空中控制、跳跃和交替足步；
- Distance、Ball、Hinge 与 Motor / Break；
- 接触派生空间声音与身体区域触觉；
- Body、Contact、Character、Joint、Sensory 和 State Root；
- RFE Generation 与 RSR Tick 语义隔离；
- VSR v0.4 三维场景和确定性像素投影；
- 36 项新增测试，总回归 160/160。

## 核心证据

正式根以 `outputs/spatial-embodiment-verify/demo-evidence.json` 为准。

## 已知限制

- Convex Hull 当前是作者提供的单个凸网格 fixture；自动凸分解、地形高度场、车辆轮胎接触和完整接触流形尚未实现；
- 角色身体仍是直立胶囊；
- 关节为参考求解器；
- 感知事件没有连接真实空间音频和触觉硬件；
- VSR 投影性能来自 CPU 参考路径，而不是 GPU FPS。
