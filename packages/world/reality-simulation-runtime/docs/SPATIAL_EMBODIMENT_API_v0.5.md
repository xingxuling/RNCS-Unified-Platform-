# RSR v0.5 API 摘要

## 主要入口

- `SpatialEmbodimentWorld(config)`
- `world.step(commands)`
- `world.run(ticks, commands)`
- `world.snapshot()`
- `SpatialEmbodimentWorld.fromSnapshot(snapshot)`
- `replaySpatialEmbodiment(config, ticks, commands)`
- `spatialEmbodimentSnapshotToCausalDelta(snapshot, baseRealityRoot)`
- `projectSpatialEmbodiment(snapshot, options)`

## 主要命令

- `apply-impulse`
- `set-velocity`
- `teleport`
- `move-character`
- `jump-character`
- `set-joint-motor`
- `set-listener`
