# RNCS Agent Capability Contract v0.1

状态：CANDIDATE / EXECUTABLE CONTRACT
目标：让 AI/Agent 不再通过“猜模块、猜动作、猜权限”调用 RNCS，而是通过统一能力目录完成发现、匹配、规划、授权、调用、取证和回滚。

## 0. 设计裁决

RNCS 已经拥有 `rncs.modules.json` 和 Reality One Gateway 的 runtime manifest：它们解决“有哪些 runtime、有哪些 action、版本与依赖是什么”。

Agent Capability Contract 不替代它们，而是在其上增加 AI 调用所需的语义层：

```text
runtime manifest
  runtime_id / version / actions / protocols / requires
                ↓
Agent Capability Contract
  effect / authority / evidence / schemas / readiness / aliases
                ↓
Agent Planner / DWAC / BIGS / Reality Studio
  discover → match → plan → invoke → verify → commit/project
```

## 1. 必须解决的七个问题

每个能力必须让 Agent 能在不阅读源码的前提下回答：

1. **它是什么？** `capability_id`, `title`, `semantic_role`
2. **它怎么调用？** `runtime_id`, `action`
3. **它需要什么？** `input_contract`, `preconditions`, `dependencies`
4. **它会改变什么？** `effect_class`, `side_effects`
5. **谁有权调用？** `authority`
6. **如何证明调用发生过？** `evidence`, `receipt`
7. **失败后怎么办？** `reversibility`, `rollback`, `failure_modes`

## 2. 统一 Effect Class

```text
READ_ONLY       读取/检查，不改变状态
SIMULATION      只改变沙箱/候选现实，不改变权威现实
PROVISIONAL     产生候选 delta / proposal / preview
AUTHORIZED      已获授权但尚未提交
AUTHORITATIVE   改变权威现实或 generation
PROJECTION      把已提交状态投影到 VSR/host/UI
NETWORK_STATE   改变会话/同步状态，但不等价于现实 commit
```

关键规则：Agent 不能把 `SIMULATION`、`PROVISIONAL` 或 `PROJECTION` 的成功冒充为 `AUTHORITATIVE` 成功。

## 3. 统一 Readiness

```text
ready          可直接调用
experimental   已有实现，但契约/稳定性仍在演化
partial        只能完成该能力的一部分
unavailable    当前运行环境不可调用
blocked        前置条件、权限或依赖不满足
```

`unavailable` 和 `blocked` 必须带 `reason`，禁止静默失败。

## 4. 统一 Authority Model

每个 capability 声明：

```json
{
  "mode": "none | scope | explicit-approval | commit-gate",
  "required_scopes": [],
  "approval_roles": [],
  "policy_runtime": "rncs.aaf",
  "decision_action": "evaluate"
}
```

推荐规则：

- `READ_ONLY` 默认 `none`
- `SIMULATION` 默认 `scope`
- `PROVISIONAL` 默认 `scope`
- `AUTHORITATIVE` 必须 `explicit-approval` 或 `commit-gate`

## 5. 统一 Evidence / Receipt Model

Gateway 已经为每次 `invoke` 生成 `reality-one.invocation-receipt.v0.3`，包含 runtime/action/payload_root/result_root/duration 等。

Contract 进一步要求能力说明：

```json
{
  "evidence": {
    "gateway_receipt": true,
    "domain_receipts": ["..."],
    "required_roots": ["proposal_root", "decision_root", "commit_root"],
    "ledger_target": "Evidence Ledger"
  }
}
```

如果能力会产生权威变化，至少必须能够追溯 `proposal_root → decision_root → commit_root/result_generation`。

## 6. 统一 Invocation Envelope

Agent 不直接拼 runtime 私有调用，而是生成：

```json
{
  "format": "rncs.agent-capability-invocation.v0.1",
  "capability_id": "reality.branch.simulate",
  "actor": {
    "subject_id": "subject:...",
    "scopes": ["..."]
  },
  "goal_ref": "intent:...",
  "inputs": {},
  "constraints": [],
  "dry_run": false,
  "request_id": "agent-request:...",
  "idempotency_key": "...",
  "expected_effect": "SIMULATION"
}
```

Adapter 再将它 lowering 到：

```text
gateway.invoke(runtime_id, action, payload, opts)
```

## 7. 高层标准动作面

Agent 只应优先学习以下稳定语义动作，而不是记忆所有内部函数：

| 标准动作 | 含义 |
|---|---|
| inspect | 查询状态、健康、结构与可用性 |
| discover | 发现 runtime / capability / provider |
| validate | 只验证，不执行 |
| simulate | 在候选现实或沙箱运行 |
| compare | 比较候选现实 |
| propose | 形成 proposal / transition draft |
| authorize | 权限判断或显式批准 |
| execute | 执行已允许的动作 |
| commit | 提交权威现实变化 |
| project | 生成视觉/宿主投影 |
| replay | 确定性回放 |
| reconcile | 网络/状态收敛 |
| rollback | 回到已知稳定版本 |

每个 capability 通过 `standard_verb` 映射到其中之一。

## 8. 当前源码的 v0.1 能力映射

以下映射仅引用当前 Reality One Gateway runtime manifests 已声明的 action；不把未声明能力包装成“已完成”。

### 8.1 RBF / Candidate Reality

- `reality.branch.workspace.create` → `rncs.rbf:createWorkspace`
- `reality.branch.simulate` → `rncs.rbf:simulateBranch`
- `reality.branch.compare` → `rncs.rbf:compareBranches`
- `reality.branch.merge.propose` → `rncs.rbf:createMergeProposal`
- `reality.branch.authority.request` → `rncs.rbf:createAuthorityRequest`
- `reality.branch.authority.decide` → `rncs.rbf:issueAuthorityDecision`
- `reality.branch.transition.draft` → `rncs.rbf:createTransitionDraft`
- `reality.branch.merge.apply` → `rncs.rbf:applyMergeProposal`
- `reality.branch.rebase` → `rncs.rbf:rebaseWorkspace`

### 8.2 Authority

- `authority.policy.seal` → `rncs.aaf:sealPolicy`
- `authority.approval.seal` → `rncs.aaf:sealApproval`
- `authority.evaluate` → `rncs.aaf:evaluate`

### 8.3 Behavior

- `behavior.normalize` → `rncs.behavior:normalize`
- `behavior.validate` → `rncs.behavior:validate`
- `behavior.run` → `rncs.behavior:run`

### 8.4 RFE / Authoritative Reality

- `reality.authoritative.init` → `rncs.rfe:init`
- `reality.authoritative.status` → `rncs.rfe:status`
- `reality.authoritative.materialize` → `rncs.rfe:materialize`
- `reality.authoritative.verify` → `rncs.rfe:verify`

### 8.5 RSR / VSR

当前 Gateway 暴露：

- `simulation.spatial.load` → `rncs.rsr:loadSpatial`
- `projection.spatial3d.load` → `rncs.vsr:loadSpatial3d`

注意：这两个 action 当前更接近“加载底层 runtime exports”，不是完整稳定的 Agent 高层仿真/投影 API，因此 readiness 应标为 `partial`。

### 8.6 Network

- `network.session.create`
- `network.session.join`
- `network.input.submit`
- `network.tick.advance`
- `network.snapshot.pull`
- `network.delta.pull`
- `network.acknowledge`
- `network.reconcile`
- `network.disconnect`
- `network.reconnect`
- `network.health.inspect`
- `network.session.close`

全部 lowering 到 `rncs.network` 当前 manifest 声明的同名语义 action。

## 9. Agent 规划规则

Agent 的默认规划顺序：

```text
1. capability.match(goal)
2. capability.describe(selected)
3. inspect health/readiness
4. validate inputs/preconditions
5. 如果 effect >= PROVISIONAL：建立 evidence context
6. 如果需要 authority：AAF evaluate / approval
7. invoke
8. verify receipt/result roots
9. 如果是候选现实：compare
10. 只有明确批准后才 commit
11. project / report
```

禁止：

- 未经授权直接跳过 Candidate / Authority / Commit Gate
- 把 VSR 投影成功视为 RFE commit 成功
- 把 network tick 前进视为权威 generation 已前进
- 对 `partial` 能力自动推断不存在的参数或动作

## 10. Gateway 最小升级建议

Reality One Gateway 已经有 `discover()`、`health()`、`invoke()`、runtime registry 与 invocation receipt。

v0.1 建议只增加四个薄接口，不重写现有 gateway：

```text
listCapabilities(filters?)
describeCapability(capability_id)
matchCapabilities(query)
invokeCapability(capability_id, invocation)
```

其中 `invokeCapability` 只做：

```text
Contract validation
→ readiness check
→ authority preflight
→ payload lowering
→ existing gateway.invoke
→ receipt normalization
```

## 11. 速度收益来源

该契约不会直接提高模型 token/s 或 RSR tick/s；它优化的是：

```text
模块搜索时间 ↓
接口理解时间 ↓
错误动作尝试 ↓
权限失败重试 ↓
多模块组合规划时间 ↓
故障定位时间 ↓
上下文长度 ↓
```

尤其是当前 Gateway manifest 已经声明 runtime/actions/dependencies，因此 v0.1 不需要重新设计 RNCS，只需要把已有机器可读信息进一步编译成 Agent 可用能力目录。

## 12. READY 标准

RNCS Agent Capability Contract v0.1 进入 READY 至少需要：

1. JSON Schema 可机器验证
2. 当前 Gateway runtime manifests 可生成 capability registry
3. capability_id 在相同版本内稳定
4. 所有能力都有 effect_class
5. 所有非 READ_ONLY 能力都有 authority 声明
6. 所有调用都有 gateway receipt
7. unavailable / partial 不得伪装 ready
8. 至少完成以下闭环集成测试：
   - discover → match → describe
   - simulate → compare
   - authority evaluate
   - commit 前拒绝越权
   - invoke receipt 可验证

## 13. v0.2 方向

- 为每个 action 增加精确 input/output schema refs
- RSR/VSR 从“load runtime”升级为高层 Agent API
- Capability cost/latency profile
- 常用调用链模板与缓存
- RCL projection：把 capability contract 编译成 RCL 可验证动作面
- TINP/OPP 外部 provider 自动注册
