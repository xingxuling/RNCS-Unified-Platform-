# Visual State Runtime（VSR）v0.1.0-alpha.5

> **同一个现实可以被多个主体不同地看见，但不能因此变成多个互相矛盾的现实。**

VSR 是确定性、后端中立、Agent-native 的视觉状态运行时。Alpha.5 在 Alpha.4 的 Reality One 持续生命周期投影之上，新增独立的 **Observer Projection Fabric**：同一个权威 DisplayState 可以按主体角色、权限范围和安全级别生成显示、脱敏或隐藏后的多种视图，并验证这些视图仍然属于同一个现实状态。

```text
Reality One / RFE 权威状态
→ VSR 确定性 DisplayState
→ Observer Profile + Observer Policy
→ show / redact / hide
→ 多观察者 DisplayState
→ Reality Invariant 等价验证
```

## Alpha.5 新增

- `@vsr/observer-projection` 独立观察者投影包；
- `vsr.observer-profile.v0.1` 观察者档案；
- `vsr.observer-policy.v0.1` 节点权限策略；
- 显示、脱敏、隐藏三态投影；
- 父节点策略向后代继承；
- 观察者决策预编译与缓存；
- `vsr.observer-projection-manifest.v0.1` 证据清单；
- 多视图 Reality Invariant 等价验证；
- `RealityOneVSRSession.evaluateForObserver(s)`；
- 所有者、操作员、审计员、访客四种 Reality One 预设；
- Studio 观察者即时切换；
- CLI `project-observer`；
- Observer Profile / Policy JSON Schema Draft 2020-12；
- 机制测试增至 29 项，Studio 冒烟检查增至 24 项。

Alpha.4 的实时事件链、确定性重放和单一长期 `VSRRuntimeSession`；Alpha.3 的 Projection Branch Cache 与 `item-manifest-v1` 均继续保留。

## 环境

- Node.js 20+
- TypeScript `tsc` 5.8+
- FFmpeg 可选
- 无 npm 运行时依赖

## 快速验收

```bash
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run benchmark
npm run benchmark:live
npm run benchmark:observer
```

启动 Studio：

```bash
npm run studio
```

访问 `http://127.0.0.1:4173`，点击 **Reality One 实时演示**，然后切换所有者、操作员、审计员或访客。

## 多观察者 API

```ts
import {
  RealityOneVSRSession,
  createRealityOneObserverProfile,
  realityOneResultToLifecycleEvents,
} from './packages/adapter-reality-one/src/index.js';

const session = new RealityOneVSRSession({ profile: 'desktop' });
session.replay(realityOneResultToLifecycleEvents(applicationResult));

const views = session.evaluateForObservers([
  createRealityOneObserverProfile('owner'),
  createRealityOneObserverProfile('auditor'),
  createRealityOneObserverProfile('guest'),
]);

console.log(views.verification.ok);
console.log(views.projections.map(view => view.manifest));
```

通用 Visual IR 也可直接投影：

```ts
import {
  prepareObserverProjection,
  projectDisplayForObserver,
} from './packages/observer-projection/src/index.js';

const plan = prepareObserverProjection(document);
const observerView = projectDisplayForObserver(
  plan,
  authoritativeDisplayState,
  observerProfile,
  { invariant: { generation: 12, evidenceRoot: '...' } },
);
```

## CLI

重放 Reality One：

```bash
node dist/packages/cli/src/cli.js replay-reality-one \
  examples/reality-one-lifecycle.events.json \
  --profile desktop \
  --out outputs/reality-one.vsr.json \
  --manifest outputs/reality-one-replay.json
```

为访客生成权限裁剪视图：

```bash
node dist/packages/cli/src/cli.js project-observer \
  outputs/reality-one.vsr.json \
  examples/observers/guest.observer.json \
  --time 0 \
  --out outputs/guest.display.json \
  --manifest outputs/guest.observer-manifest.json
```

输出 Schema：

```bash
node dist/packages/cli/src/cli.js schema --kind observer-profile
node dist/packages/cli/src/cli.js schema --kind observer-policy
```

## 性能基线

### 1000 节点增量求值

| 指标 | Alpha.5 |
|---|---:|
| 全量中位数 | 30.29 ms |
| 增量中位数 | 5.25 ms |
| 增量 P95 | 6.59 ms |
| 平均跳过投影节点 | 903.3 / 1000 |

### Reality One 生命周期

| 指标 | Alpha.5 |
|---|---:|
| 事件求值中位数 | 0.63 ms |
| P95 | 1.63 ms |
| 平均属性复用 | 48.8 / 58 |
| 平均跳过投影 | 48.8 / 58 |

### 多观察者投影

1050 节点、1000 可见项、4 个观察者：

| 指标 | Alpha.5 |
|---|---:|
| 四视图中位数 | 8.59 ms |
| 四视图 P95 | 10.88 ms |
| 单观察者折算中位数 | 2.15 ms |
| 等价验证 | PASS |

## 当前真实性边界

已经真实完成：Visual IR、确定性求值、表达式沙箱、依赖图、增量节点与分支缓存、Browser Canvas、Node PNG/Video、Agent 事务、RFE Adapter、Reality One 最终与实时适配、事件哈希链、观察者相对权限投影、CLI 和中文 Studio。

仍未完成：TTF/OTF 字体冻结与中文离线字形、WebSocket/SSE Reality One Bridge、RFE 密码学 Evidence Root 签名、多观察者网络同步、JPEG/WebP、mask/filter、完整 Path 与抗锯齿、GPU/XR 后端、Playwright 像素级 E2E、正式 npm 多包发布。
