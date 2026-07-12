# RSR Constraint Physics API v0.2

## 创建世界

```ts
import {
  ConstraintCausalPhysicsWorld,
  constraintVec,
} from './packages/constraint-physics/src/index.js';

const world = new ConstraintCausalPhysicsWorld({
  format: 'rsr.constraint-world.v0.2',
  worldId: 'demo',
  scale: 1000,
  stepHz: 60,
  gravity: constraintVec(0, 980),
  gridCellSize: 64000,
  maxSubsteps: 12,
  bodies: [
    {
      id: 'ball',
      kind: 'dynamic',
      position: constraintVec(50, 50),
      shape: { type: 'circle', radius: 10000 },
      inverseMassQ: 1000,
      continuous: true,
    },
  ],
});
```

## 推进与命令

```ts
world.step([
  {
    id: 'kick-001',
    tick: world.tick,
    type: 'apply-impulse',
    bodyId: 'ball',
    impulse: { x: 50000, y: -90000 },
  },
]);

const snapshot = world.run(120);
```

支持命令：

- apply-impulse；
- apply-force；
- set-velocity；
- set-kinematic-velocity；
- teleport；
- wake；
- set-constraint-enabled。

## 恢复

```ts
const checkpoint = world.snapshot();
const restored = ConstraintCausalPhysicsWorld.fromSnapshot(checkpoint);
restored.run(60);
```

## RFE 候选因果差异

```ts
import { constraintSnapshotToCausalDelta } from './packages/constraint-physics/src/index.js';

const candidate = constraintSnapshotToCausalDelta(snapshot, currentRealityRoot);
// candidate.provisional === true
```

## VSR 双投影

```ts
import {
  ConstraintPhysicsVSRBridge,
  createConstraintPhysicsObserverProfile,
} from './packages/constraint-physics-vsr/src/index.js';

const bridge = new ConstraintPhysicsVSRBridge(config);
const views = bridge.render(snapshot, [
  createConstraintPhysicsObserverProfile('player'),
  createConstraintPhysicsObserverProfile('debugger'),
]);
```
