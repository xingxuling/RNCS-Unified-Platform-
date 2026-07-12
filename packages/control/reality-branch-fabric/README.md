# Reality Branch Fabric v0.2.0-alpha.1

**现实分支织构：候选现实树、多情景仿真、沙箱执行、权威批准与RFE提交协议。**

RBF 的核心边界仍然不变：

> 候选分支不是现实。只有经过模拟、沙箱执行、权威批准并由RFE提交后的新Generation，才属于权威现实。

```text
权威 Generation
→ 建立候选现实树
→ 基准 / 不利 / 有利情景仿真
→ 多权重敏感性比较
→ 沙箱真实执行与逐步收据
→ 失败时Provider回滚
→ AAF式权威决定
→ RNCS Transition Envelope
→ RFE提交新Generation
```

## v0.2 相比 v0.1 的跃迁

v0.1更像“候选方案评分器”；v0.2开始成为“候选现实执行器”。

- 支持分支继续分叉与继承，不再限定所有方案都直接挂在主分支上。
- 每个候选同时运行基准、不利和有利情景，并输出预期值、最坏值与韧性。
- 输出Pareto前沿、四类权重敏感性和推荐稳定度。
- 生成可执行沙箱计划，逐步绑定前后状态根、Provider证据和回滚操作。
- 外部Provider可提供`execute/rollback`；回滚缺失会明确标记为`rollback_incomplete`。
- 合并提案可强制绑定已完成的执行收据。
- 合并前必须经过权威请求与批准；过期、拒绝或错配决定全部拒绝。
- 支持Generation变化后的重基线，检测主现实漂移与候选写入冲突。
- 输出Reality Studio分支面板投影、RNCS迁移草案与RFE提交收据。

## 快速运行

要求 Node.js 20 或以上。

```bash
npm test
node src/cli.mjs demo
node src/cli.mjs compare examples/strategy-workspace.v0.2.json
node src/cli.mjs execute examples/strategy-workspace.v0.2.json branch:safe
node src/server.mjs
```

Windows可以双击：

```text
启动现实分支工作台.bat
```

## 主要API

```js
import {
  createWorkspace,
  simulateBranch,
  compareBranches,
  createExecutionPlan,
  executePlan,
  createMergeProposal,
  createAuthorityRequest,
  issueAuthorityDecision,
  createTransitionDraft,
  createRfeCommitReceipt,
  rebaseWorkspace,
} from '@taowind/reality-branch-fabric';
```

## 外部Provider接口

```js
const providers = {
  'test.run': {
    async execute({step, state, mode}) {
      return {ok: true, receipt: {job_id: 'job:123'}, evidence: []};
    },
    async rollback({step, provider_receipt, mode}) {
      return {ok: true, evidence: []};
    },
  },
};
```

若Provider已经产生外部副作用，但没有实现`rollback`，后续步骤失败时执行收据会标记为`rollback_incomplete`，禁止把它伪装成完整回滚。

## 当前边界

- 内置模拟器是确定性影响模型，不等于组织、金融、物理或社会真实预测。
- 外部RSR、行业仿真器和真实Provider已具备接入口，但不是本包默认内置能力。
- 沙箱状态可以完整恢复；外部副作用只有在Provider实现回滚时才可证明恢复。
- AAF和RFE在本包中以可验证协议对象接入，不声称替代其正式运行时。
- RBF不自行批准，也不自行创造权威Generation。
