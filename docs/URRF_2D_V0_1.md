# URRF-2D v0.1｜二维通用现实表示织体

## 北极星

把二维视觉从“一个扁平图片文件”提升为 **RNCS RealityObject 的可选择、可预算、可驻留、可物化、可组合、可回执的二维 Representation Portfolio（表示组合）**。

URRF-2D 不拥有 Canonical World State（规范现实状态）。二维表示永远是候选现实投影：

```text
RNCS Canonical RealityObject
        ↓
       URRF
        ↓
    URRF-2D
   ├─ DVG Provider｜结构型二维表示
   └─ PPD Provider｜扩散型二维表示
        ↓
Materialization + Composition Receipt
```

## 三个核心对象

### 1. DVG Provider｜Distributed Vector Graph，分布式向量图

负责边界清楚、可编辑、可分层、可 LOD（细节层级）的二维结构：建筑、山体、道路主路径、桥梁、人物轮廓、UI/文字等。

默认策略：

- `representation_kind = vector-2d-dvg`
- Detail Policy（细节策略）：`hierarchical-vector-lod`
- Residency Policy（驻留策略）：`paged-vector-working-set`
- 预算单位：`vector_nodes`

### 2. PPD Provider｜Procedural Point Diffusion，程序化点状扩散

负责云、雾、辉光、光瀑逸散、树冠能量、道路流光与其他难以用刚性路径自然表达的二维连续场。

默认策略：

- `representation_kind = point-diffusion-2d`
- Detail Policy：`density-field-lod`
- Residency Policy：`field-working-set`
- 预算单位：`points`

### 3. URRF-2D Scene / Working Set

`URRF2DScene` 不是新的 Canonical Scene Truth。它是二维组合候选：登记 RNCS 对象、二维 bounds（边界）、z-index（深度顺序）以及一个或多个 DVG/PPD layer（层）。

运行时依据 viewport（视口）、zoom（缩放）、semantic priority（语义优先级）和资源预算生成 Working Set（工作集），把视口外对象显式标记为 deferred（延迟物化）。

## 物化闭环

```text
RealityObject
↓
RepresentationRef(DVG / PPD)
↓
URRF-2D Scene
↓
Working Set Plan
↓
URRF MaterializationPlan × N
↓
Provider Runtime
↓
MaterializationReceipt × N
↓
2D Composition Receipt
```

`2D Composition Receipt` 只组合已经执行的 Layer Output Root（层输出根）。它不会把视觉结果写回 RNCS Canonical State，也不会让 Provider 获得现实权威。

## v0.1 合成语义

首版保留五种合成模式：

- `normal`
- `add`
- `screen`
- `multiply`
- `overlay`

DVG 默认 `normal`；PPD 默认 `screen`。合成顺序由 `z_index` + layer ordering 决定。

## 权威边界

不可妥协：

1. Provider 不得拥有 `authoritative_world_state` 写权限。
2. URRF-2D Scene、Working Set、Composition Receipt 都是 `candidate_only=true`。
3. 图像中“门已经打开”不等于 Canonical RealityObject 的门状态已经改变。
4. 任何视觉状态反推现实状态必须经过 RNCS Authority / Commit Gate（权威/提交门）。
5. Provider 失败必须显式记录为 `PARTIAL` / `FAILED`，不得伪造完整渲染成功。

## v0.1 验收

- DVG / PPD 可以生成有效 `RepresentationRef`。
- 同一 RealityObject 可同时注册 DVG 与 PPD 表示。
- 视口外对象进入 deferred set（延迟集合）。
- DVG 使用 `vector_nodes` 预算；PPD 使用 `points` 预算。
- 混合对象能得到 2 个独立 MaterializationReceipt，再封装为一个 Composition Receipt。
- Contract-only Provider 产生 `PARTIAL`，不冒充执行成功。
- 所有二维物化保持 `canonical_state_mutated=false`。

## 后续

v0.2 可继续加入：

- tile / spatial partition（空间分片）
- Content Addressed Node（内容寻址节点）
- Vector/Point Residency（向量/点驻留）细化
- WebGPU / Canvas / SVG Renderer（渲染后端）
- Raster / Brush / Text Provider
- 基于 URRF Portfolio Runtime 的质量阶梯与跨表示 fallback（降级）
- 2D ↔ 3D Representation Transition（二维与三维表示转换）
