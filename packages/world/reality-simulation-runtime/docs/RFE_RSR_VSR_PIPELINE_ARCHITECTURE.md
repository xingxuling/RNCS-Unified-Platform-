# RFE × RSR × VSR × Build Pipeline 架构

## 职责分离

| 系统 | 负责 | 不负责 |
|---|---|---|
| RFE | 权威事实、Generation、证据、联盟提交、恢复 | 每帧物理求解、GPU 绘制 |
| RSR | 候选因果演化、物理快照、碰撞证据 | 宣布候选状态已成为现实 |
| VSR | 观察者相对视觉投影、DisplayState、后端输出 | 决定物理结果是否合法 |
| Build Pipeline | 资产编译、缓存、Manifest、验证 | 运行时权威或物理求解 |

## 数据流

```text
RFE Generation N
  ↓ SimulationSnapshot seed
RSR step 0..k
  ↓ provisional CausalDelta
RFE authority resolve + commit
  ↓ Generation N+1
VSR observer projection
  ↓ Render Backend
Screen / PNG / Video / XR
```

## 本版实现方式

VSR v0.1 的 `simulation` track 尚未开放，因此 RSR 通过稳定 Visual IR 加 runtime override 驱动物体位置。这样保持：

- VSR 文档哈希稳定；
- 物理状态根独立；
- 观察者投影不修改模拟；
- 后续可把 override 升级为正式 Render Snapshot 输入。

## 下一版接口

建议新增：

```ts
interface RenderSnapshot {
  simulationRoot: string;
  tick: number;
  transforms: Transform2D[];
  debugPrimitives: DebugPrimitive[];
  resourceManifestRoot: string;
}
```

Render Snapshot 应由 RSR 输出、VSR 消费，而不是让 VSR 直接持有物理世界对象。
