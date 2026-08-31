# RNCS Core Contract v0.1.0

现实原生计算栈的第一份跨项目共同契约。

它不新增业务功能，而是解决当前最危险的结构问题：RFE、HNAC、Living Artifact、ICAR、RSR、VSR 与 Studio 各自拥有自己的“状态、版本和历史”，但无法证明它们是不是同一次现实变化。

## 核心成果

- Reality Transition Envelope v0.1
- Subject Identity Contract
- Generation / State / Projection / Evidence 引用标准
- Python 与 Node 跨运行时确定性哈希
- Proposal → Authority → Commit → Projection 生命周期
- ICAR、HNAC、Living Artifact、VSR 旧格式适配器
- 连续性等级与命名边界强制检查
- 离线审阅工作台
- Entity Kernel v0.1：typed Fragment、Composition Signature、确定性 State Batch 与 Deferred Mutation Ledger
- Representation Transition Candidate v0.1：跨表示 identity、authority、equivalence、residency/detail policy 与 candidate rollback；不会绕过 RFE commit
- v0.3 Truth Layer Candidate：WorldTime、authority-receipted WorldEvent、deterministic event-log replay 与 provenance-bound Fact World Tree；不把 Subject Memory 当作 Canonical Fact
- v0.3 Reality Property & Law Candidate：带来源、证据、版本和单位/维度的 Reality Quantity，RNCS-owned PropertySet/LawBindings，以及候选属性事务；Provider 只能计算或近似，不能改写 Canonical Property/Law
- v0.3 Reality Access Candidate：独立 DetailVector、主体 RealityHorizon、InterestGraph、多域 Query 结果和容量受限 CognitiveWorkingSet；查询排序不拥有 Canonical State，结果必须回源复验

## 快速运行

```bash
python -m rncs_contract verify --envelope examples/committed-transition.json
node src/cli.mjs verify --envelope examples/committed-transition.json
python -m unittest discover -s tests -p 'test_*.py'
node tests/run.mjs
```

## 最重要的规则

```text
RFE Generation = 唯一权威现实代际
HNAC Snapshot   = 宿主副本状态
LAF Revision    = 工件内部修订
ICAR Session    = 意图执行记录
RSR Snapshot    = 候选模拟状态
VSR/AER State   = 观察者投影状态
```

## 当前定位

这是 v0.1 合同与参考运行时，不是分布式共识实现。它负责把不同项目的语义边界冻结，实际权威提交仍由 RFE 执行。

## Reality Property & Law v0.3 Candidate

`src/reality-property.mjs` 提供 `RealityQuantity`、`RealityPropertySet`、`RealityLawBindings` 与 `RealityPropertyTransition`。所有属性值必须明确 `unit`、`dimension`、`provenance_ref` 和 `authority_ref`；`validateRealityQuantityOperation('+', ...)` 会拒绝不同物理维度或不同单位的相加。该模块是可验证的合同候选，不宣称已经完成分布式 Property Commit、物理 Provider 或生产级多物理仿真。

`src/reality-access.mjs` 提供 `DetailVector`、`RealityHorizon`、`InterestGraph`、`RealityQuery`、确定性多域筛选/排序和 `CognitiveWorkingSet`。它只读取对象索引与 RNCS PropertySet，不执行 Canonical Mutation；权限、视域和容量过滤在返回候选前完成。

## Entity Kernel v0.1

`src/entity-kernel.mjs` 提供一个小型、可复核的状态内核：Fragment Schema 只接受明确类型；Entity 由 Fragment Composition 形成稳定组合根；读取通过确定性 State Batch；写入先进入 Deferred Mutation Ledger，经过 authority、预算和 expected entity root 检查后才提交。\`decimal\` 使用规范化十进制字符串，保持 Node/Python 共享哈希不引入浮点歧义。
