# RNCS Generative Morphogenesis Fabric v0.1

状态：`CANDIDATE / LOCAL_TECHNICAL_VERIFIED`

## 目标裁决

把来自 3D 模型生成启发的四个概念抽象为跨 2D、3D、UI、CAD、动画和持续世界的通用生成器官，而不是将其锁死在某个渲染后端：

1. **文字驱动图论翻译法**；
2. **多量式五维属性模型生成**；
3. **表示复杂度动态扩展收缩状态机**；
4. **分布式生成扩散引擎**。

核心链：`Intent / Language → Graph → Multi-Quantity 5D → Dynamic Complexity → Distributed Generative Diffusion → URRF / RAGF / UI / World Providers`。

## 资产考古裁决

现有 RNCS 已有 URRF、URRF-2D（DVG + PPD）、RAGF、Character Genome / Phenotype / Native Character Morphogenesis。因此新包不能成为第二个 URRF 或第二个 RAGF。它的 Canonical Role 是 **generation-before-representation**：先把意图编译为可生成结构和动态复杂度计划，再交给下游表示/资产器官。

## 四个核心器官

- **Text → Graph Translation**：输出对象、边、约束、来源和根；当前是确定性参考前端，不宣称等同通用自然语言理解模型。
- **Multi-Quantity Five-Dimensional Attribute Model**：五维数量固定为 5，但名称领域可定义，每维允许多个 quantity、weight、unit、provenance。
- **Dynamic Representation Complexity State Machine**：把“模型面数动态扩展/收缩”推广到 faces、vector_nodes、points、gaussians、components、entities、samples 等任意复杂度预算，并使用 hysteresis 防止抖动。
- **Distributed Generative Diffusion**：生成通道组成 DAG，按拓扑波次形成 worker contracts，在波间传播约束，以阻尼、最大迭代和收敛阈值形成 bounded execution。

## 权威边界

所有生成输出保持 `candidate_only=true`、`authoritative=false`、`canonical_state_mutated=false`、`rncs_authority_required_for_commit=true`。

## RCL 形式旁路

`packages/world/generative-morphogenesis-fabric/rcl/generative-morphogenesis.rcl` 已由当前 RCL runtime 实际执行，`foresee` 与 `realize` 成功，`draft.status` 进入 `reference-verified`，同时 `generation.authoritative=false`、`generation.canonical_state_mutated=false`。

## 当前边界

不宣称商业级 2D/3D 美术质量、不宣称通用自然语言理解、不宣称跨机器生产集群已实现，也不宣称固定五维结构对所有领域数学最优。
