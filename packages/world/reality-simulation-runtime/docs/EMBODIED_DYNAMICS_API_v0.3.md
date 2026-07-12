# Embodied Dynamics API v0.3

## 核心类

```ts
const world = new EmbodiedDynamicsWorld(config)
world.step(commands)
world.run(ticks, commands)
world.snapshot()
```

## 配置

`EmbodiedDynamicsWorldConfig` 包含：

- 固定步频、重力、宽相类型；
- 速度/位置迭代次数；
- CCD 微步预算；
- 材质与材质交互；
- 因果场；
- 具身主体与复合 Fixture；
- 持久关系约束。

## 查询

```ts
world.queryAabb({ min, max })
world.queryPoint(point)
world.rayCast(origin, translation, firstHitOnly)
world.shapeCastCircle(center, radius, translation)
```

查询结果稳定排序并写入 `queryRoot`。

## 命令

- `apply-impulse`
- `apply-force`
- `apply-torque`
- `set-velocity`
- `set-angular-velocity`
- `set-kinematic-velocity`
- `set-transform`
- `wake`
- `set-joint-enabled`
- `set-joint-motor`

## RFE 适配

```ts
const delta = embodiedSnapshotToCausalDelta(snapshot, baseRealityRoot)
```

输出仍是 provisional；需要交给 RFE Authority Resolver。

## VSR 适配

```ts
const bridge = new EmbodiedDynamicsVSRBridge(config)
const rendered = bridge.render(snapshot, observers)
```

玩家视图隐藏速度、标签、关节和接触标记；调试/审计视图保留。
