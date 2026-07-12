# @vsr/adapter-reality-one

Reality One / ICAR 到 VSR 的最终结果与实时生命周期适配器。

## 最终结果

```ts
import { realityOneResultToVSR } from './src/index.js';
const document = realityOneResultToVSR(applicationResult, { profile: 'desktop' });
```

## 实时会话

```ts
import { RealityOneVSRSession } from './src/index.js';

const session = new RealityOneVSRSession({ profile: 'desktop' });
session.append({
  format: 'reality-one.lifecycle-event.v0.1',
  sessionId: 'session:1',
  sequence: 1,
  type: 'intent.received',
  payload: { intentText: '生成项目状态报告' },
});

const result = session.evaluate();
```

适配器保证：

- 同一 Visual IR 模板持续存在；
- 事件序列严格递增；
- 事件形成可复核哈希链；
- 相同事件流可确定性重放；
- 只更新与变化状态绑定的节点和投影分支；
- 可导出任意阶段的 VSR 快照与重放清单。


## 权威交互闭环

```ts
const proposal = session.proposeInteraction(input, observer, device);
const result = session.commitInteraction(proposal, authorization);
```

批准或拒绝动作会生成 Interaction Commit Receipt，并在成功后写入新的 `authority.resolved` 生命周期事件。
