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

- 精确旋转碰撞、3D GJK/EPA 和完整接触流形尚未实现；
- 角色身体仍是直立胶囊；
- 关节为参考求解器；
- 感知事件没有连接真实空间音频和触觉硬件；
- VSR 投影性能来自 CPU 参考路径，而不是 GPU FPS。
