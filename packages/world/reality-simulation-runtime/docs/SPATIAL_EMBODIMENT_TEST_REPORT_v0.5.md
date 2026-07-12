# RSR v0.5 三维具身动力学测试报告

## 测试结果

- VSR 基线：29/29 PASS
- RSR v0.1：11/11 PASS
- RSR v0.2：19/19 PASS
- RSR v0.3：30/30 PASS
- RSR v0.4：35/35 PASS
- RSR v0.5：36/36 PASS
- 总计：160/160 PASS

## v0.5 覆盖范围

- Sphere / Box / Capsule 三维接触；
- Sensor 与 Collision Mask；
- 三维冲量、角速度、重力和阻尼；
- 角色移动、跳跃、空中控制和左右足步；
- Distance / Ball / Hinge / Motor / Break；
- Point / AABB / Ray Query；
- Replay 与 Snapshot Recovery；
- Bullet 微步与 Sleep；
- 空间声音、身体区域触觉和 Sensory Root；
- RFE CausalDelta；
- VSR v0.4 场景、帧验证、确定性 PNG 和篡改检测。

## 性能参考

本次 Node.js 单线程容器环境：

- 64 Bodies：约 22.16 ms/Tick；
- 144 Bodies：约 42.62 ms/Tick；
- 256 Bodies：约 68.68 ms/Tick；
- 32 Character、180 Tick：约 14.59 ms/Tick；
- 48 Bodies、480×270 CPU参考投影：约 913 ms。

这些数据表明当前适合作为确定性参考内核和小规模样板；大规模实时世界仍需要结构化数组、WASM/SIMD、多线程、GPU物理或更成熟的底层Provider。
