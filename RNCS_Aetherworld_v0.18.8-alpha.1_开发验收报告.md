# RNCS＋Aetherworld v0.18.8-alpha.1 开发验收报告

## 1. 本次目标

在 RCL v0.3 的九域现实、Knowledge Reality、Inner Reality 与 Execution Reality 基础上，将自然语言、理解和创造实现为三个复合运行平面，并接入 RNCS 权界和正式现实提交链。

## 2. 实际交付

### Natural Language Reality

- `language / utterance / intent / interpret` 语法；
- `Utterance` 与 `Intent` 类型；
- 话语、说话者、语言区域、通道、槽位、置信度和证据链；
- 自然语言只能产生候选意图，不能直接产生外部副作用。

### Understanding Reality

- `understanding / hypothesis / understand` 语法；
- `Understand<T>` 类型；
- 依赖、解释、置信度、覆盖率、一致性与证据；
- 编译器拒绝不携带证据的理解依赖。

### Creative Reality

- `creation / candidate / select / create` 语法；
- `Create<T>` 类型；
- 候选的新颖度、效用、可行性、风险与综合评分；
- 低质量候选集合由 `preserve` 阻断，选中候选仍不等于获准执行。

### 组合运行平面

```text
九域现实
→ Natural Language Reality
→ Understanding Reality
→ Creative Reality
→ Inner Reality v0.2
→ Authority / Candidate Reality
→ Execution Reality v0.2
```

## 3. 端到端证明

输入：

```text
请打开温室灯
```

运行证据：

```text
意图：activate greenhouse.light
意图置信度：0.97
理解置信度：0.96
候选 activate：0.881
候选 ask-for-clarification：0.5415
选中：activate
权限：greenhouse.control
最终：greenhouse.light = true
执行次数：caretaker.actions = 1
```

候选方案在进入 `realize` 之前保持内部状态；没有权力凭证时不能改变设备现实。

## 4. 验收结果

### RCL 专项

```text
28 tests
28 passed
0 failed
```

覆盖 v0.1—v0.3 回归、中文话语解释、意图证据、理解置信度传播、理解覆盖率与一致性、创造候选评分、低分阻断、依赖类型检查及完整认知—权界—执行链。

### 母工程集成

- 模块注册：`rcl 0.4.0-alpha.1`；
- `npm run test:rcl`：28/28；
- `npm run demo:rcl:cognition`：成功；
- `npm run health`：`healthy`；
- 工作区引导：31 个本地包链接成功。

证据目录：`docs/evidence/rcl-v0.4/`。

## 5. 诚实边界

本版是确定性、可解释、受权界控制的认知运行地基，不宣称已经完成：

- 通用自然语言理解；
- 开放世界常识学习；
- 自动反例发现与理论修正；
- 大规模文本、图像、声音生成；
- 原生 RCL VM、自托管编译器或分布式认知事务。

LLM 与专用模型以后可以成为感知、语言解释或候选生成 Provider，但不能替代证据、理解、创造选优和权界提交。

## 6. 裁决

RCL 已从“九域现实＋少数据知识智能”推进为具有语言入口、可解释理解、受约束创造和正式执行边界的认知运行语言。当前最关键的下一地基不再是增加名词，而是强化反证、目标、记忆连续性、计划与反馈学习。
