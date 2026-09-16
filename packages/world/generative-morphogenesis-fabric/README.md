# Generative Morphogenesis Fabric v0.1

**中文：通用生成形态发生织体（候选名称）**

这个包把四个通用概念实现成 RNCS 的候选生成层，而不是把它们限制成二维绘图或三维建模技巧：

1. **文字驱动图论翻译法**：自然语言 / 意图 → 对象、关系、约束图；
2. **多量式五维属性模型生成**：每个领域自行定义五个正交维度，每维允许多个有权重量；
3. **表示复杂度动态扩展收缩状态机**：把 3D 面数推广到 `faces / vector_nodes / points / gaussians / components / entities / samples` 等任意复杂度预算；
4. **分布式生成扩散引擎**：几何、材质、光照、运动、氛围、细节等生成通道按依赖图分波执行并迭代收敛。

## 在 RNCS 中的位置

```text
Intent / Language
  ↓
Text → Graph Translation
  ↓
Multi-Quantity 5D Attribute Model
  ↓
Dynamic Representation Complexity State Machine
  ↓
Distributed Generative Diffusion
  ↓
Downstream Projection Plan
  ├─ URRF-2D → DVG + PPD
  ├─ URRF-3D → Mesh + Gaussian + Point Cloud
  ├─ RAGF-3D → Mesh + Material + Rig + LOD
  ├─ UI → Component Graph + Vector + Layout
  └─ World → Entity Graph + Field + Simulation
```

这个包在 **URRF / RAGF 之上**生成候选结构；URRF 仍负责“现实对象采用什么表示身体”，RAGF 仍负责资产家族生产。这里不复制它们的 Canonical Owner 语义。

## 权威边界

所有输出默认 `candidate_only=true`、`authoritative=false`、`canonical_state_mutated=false`、`rncs_authority_required_for_commit=true`。

## v0.1 能力

- 中英文有限规则的 deterministic（确定性）文本关系提取，也可直接传入显式实体 / 关系；
- 五维名称领域可定义，每维可包含多个量、权重、单位与证据来源；
- 复杂度状态机可统一控制 faces、vector_nodes、points、gaussians、components、entities、samples 等复杂度；
- 扩散引擎基于 DAG（有向无环图）构造 execution waves（执行波次），提供 worker hint、阻尼和有界迭代；
- 可生成 URRF-2D、URRF-3D、RAGF-3D、UI、World 的 candidate projection plan。

## 明确非目标

- v0.1 不是通用自然语言理解模型；
- distributed 指可分布执行契约，不宣称已经实现跨机器网络调度；
- 不宣称固定五维对所有领域天然最优；
- 不把契约测试冒充商业级视觉 / 3D 质量验证。
