# 动画、音频与特效 API v0.4

## 1. 创建体验世界

```ts
import {
  ExperienceFabricWorld,
  experienceSnapshotToCausalDelta,
} from './packages/experience-fabric/src/index.js';

const world = new ExperienceFabricWorld(config);
const snapshot = world.run(120);
const delta = experienceSnapshotToCausalDelta(snapshot, currentRealityRoot);
```

## 2. 发送语义事件

```ts
world.emit({
  id: 'contact:hero:sword:enemy',
  tick: world.tick,
  type: 'attack.impact',
  position: { x: 420, y: 280 },
  intensityQ: 900_000,
});
```

Binding 可以同时：

- 触发动画参数；
- 安排 Audio Cue；
- 启动 Effect Graph；
- 派生新的语义事件。

## 3. 动画状态机

```json
{
  "id": "base",
  "initialState": "idle",
  "states": [
    { "id": "idle", "clipId": "idle" },
    { "id": "attack", "clipId": "attack" }
  ],
  "transitions": [
    {
      "id": "idle-to-attack",
      "from": "idle",
      "to": "attack",
      "durationTicks": 3,
      "conditions": [
        { "parameter": "attack", "op": "trigger" }
      ]
    }
  ]
}
```

## 4. 骨骼与 IK

属性轨迹使用统一路径：

```text
skeleton:<skeletonId>/bone:<boneId>.rotation
skeleton:<skeletonId>/bone:<boneId>.position.x
skeleton:<skeletonId>/bone:<boneId>.position.y
```

双骨 IK 通过动画参数获得目标：

```json
{
  "rootBone": "upper-arm",
  "midBone": "forearm",
  "endBone": "hand",
  "targetXParameter": "hero:aimX",
  "targetYParameter": "hero:aimY",
  "weightParameter": "hero:ikWeight"
}
```

## 5. 离线音频

```ts
import { renderExperienceAudio } from
  './packages/experience-fabric-audio/src/index.js';

const result = renderExperienceAudio(config, snapshot, {
  sampleRate: 48_000,
  normalize: true,
});

writeFileSync('experience.wav', result.wav);
```

支持：

- Sine / Square / Triangle / Saw / Noise；
- 内联 PCM Sample；
- 频率扫描；
- ADSR；
- Gain / Pan / Spatial Attenuation；
- Bus Gain / Low Pass / Delay；
- Voice Priority 和预算。

## 6. 特效图

```json
{
  "id": "impact-sparks",
  "durationTicks": 30,
  "emitters": [
    {
      "id": "sparks",
      "bursts": [{ "tick": 0, "count": 64 }],
      "maxParticles": 128,
      "lifetimeTicks": { "min": 12, "max": 28 },
      "spawn": { "type": "circle", "radius": 12 },
      "speed": { "min": 120, "max": 520 },
      "angleTurnsQ": { "min": -500000, "max": 500000 }
    }
  ],
  "screenEffects": [
    { "type": "shake", "durationTicks": 10, "intensityQ": 800000 }
  ]
}
```

## 7. VSR 多观察者投影

```ts
import {
  ExperienceFabricVSRBridge,
  createExperienceObserverProfile,
} from './packages/experience-fabric-vsr/src/index.js';

const bridge = new ExperienceFabricVSRBridge(config);
const output = bridge.render(snapshot, [
  createExperienceObserverProfile('player'),
  createExperienceObserverProfile('debugger'),
  createExperienceObserverProfile('accessibility'),
]);
```

- Player：画面与游戏反馈；
- Debugger：状态、事件和 Evidence；
- Accessibility：声学字幕；
- Auditor：完整审计视图。

## 8. CLI

```bash
npm run demo:experience-fabric
npm run verify:experience-fabric
npm run test:experience-fabric
npm run benchmark:experience-fabric
```

CLI 输出：

- PNG 帧序列；
- 玩家、调试、无障碍静帧；
- 立体声 WAV；
- MP4 演示；
- Snapshot；
- RFE CausalDelta；
- Evidence JSON。
