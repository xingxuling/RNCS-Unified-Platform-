# World Body IR v0.1：多文明联邦裁决与内部执行计划

> 状态：`APPROVED_FOR_CANDIDATE_IMPLEMENTATION`
> 审计基线：`main-95@da9d2da3f8b46f40972c06d3f0f24b1e2b5b20f4`
> 审计日期：2026-08-02（Asia/Shanghai）
> 约束：本文件是编码前门禁。它只授权候选实现、专项测试和差分证据，不授权现实提交，也不预设 F5 结论。

## 0. 事实、推断、假设与风险

### 已核验事实

- 仓库默认分支为 `main-95`，审计提交为 `da9d2da…`。
- Suite 实际版本为 `0.19.8-alpha.1`；RSR 为 `0.9.0-alpha.1`；VSR 为 `0.8.0-alpha.1`。
- RSR 的运行协议仍为 `rsr.spatial-embodiment.v0.6` 与 `rsr.authoritative-state.v0.7`。
- VSR 的主要运行协议仍为 `vsr.spatial-reality-3d.v0.7` 与 `vsr.temporal-presentation.v0.6`；统一发现清单仍宣告 `vsr.gltf-import.v0.1`，而实际构建 importer 导出 `vsr.gltf-import-receipt.v0.2` / asset `0.2.0-alpha.1`，这是仓库当前需保留的版本面漂移事实。
- `rncs-core-contract` 已区分 proposal、authorization、commit 与 projection；VSR projection 不拥有 commit。
- 现有 RSR→Network→VSR 路径会验证 frame/body root，并保持 authority root 与 presentation/frame root 分离。
- RSR 的位置和欧拉旋转使用整数尺度；VSR 桥接中仍显式手写了尺度换算、fixture→mesh、事件→视觉节点等胶水。
- VSR frame plan 已有 pass/resource 列表与多类 root，但当前 pass 只声明依赖和资源集合，没有统一的读写、生命周期、队列和 barrier 语义。
- 仓库树与目标源码中未发现 `world-body-ir`、`WorldBodyEntity` 或等价 `BodyMap` 根模块。
- `engine/v0.6` 是历史参考源码，其 README/manifest 中 RSR/VSR 版本和测试计数早于当前包事实；不可用作本任务的当前通过证明。
- VSR 当前明确未证明真实浏览器 GPU adapter、真实纹理/阴影像素与目标硬件性能；RCL 当前明确将 GPU、网络、数据库、文件系统与设备驱动留在 Provider 层。

### 工程推断

- 最大的偶然复杂度不在单个物理公式或 Shader，而在同一实体、同一时间和同一事件跨 authority、physics、network、presentation、render graph 的重复表示与手工映射。
- 最小有价值切入点是新增独立的声明式 IR、形式检查器和 codegen，不在 v0.1 重写 RSR/VSR 求解器或渲染后端。
- 生产差分必须调用仓库中真实 RSR/VSR 导出；仅让 reference model 自己通过不能提升到 production parity。

### 暂定假设

- v0.1 以离散 tick、整数定点量和规范化散列为可判定核心；浮点 GPU/Shader 结果通过容差与观察等价关系处理。
- v0.1 支持 sphere、box、capsule 和现有 Cook-Torrance/glTF 路径；不把任意凸体、布料、流体、GI、TAA 或 XR 纳入已证明闭包。
- v0.1 codegen 生成 specialization 与适配器，底层碰撞、求解器、Shader、GPU/平台 Provider 保持手写。

### 已知风险

- TypeScript 构建与 workspace 依赖若不能在干净环境复现，生产差分只能记为 `UNVERIFIED`。
- VSR 统一发现清单与实际 glTF importer receipt/version 的漂移若未协调，外部 runtime discovery 可能选错契约。
- 规范化、坐标尺度或欧拉/四元数边界若处理不一致，会制造“形式模型通过、生产根不同”的假阳性。
- 把历史 manifest 的测试数抄入新证据会造成证据漂移；所有新计数必须由本次命令回执产生。

## 1. 真实问题重命名

**原任务名：** RSR/VSR 五级数学化与统一世界身体 IR。
**工程重命名：** “建立一条权威状态到可观察帧的、可生成且不可越权的语义编译链”。

目标链：

```text
World Declaration
  -> World Body IR
  -> validated authority/physical/visual/temporal/asset/observer/event graph
  -> generated RSR/VSR/network/render-graph specialization
  -> real runtime execution
  -> differential witnesses + evidence ledger
```

它解决的是跨层语义重复和权界漂移，不承诺用数学说明替代必要的物理计算、Shader、GPU、网络或平台后端。

## 2. 多文明联邦（顺序执行记录）

### 2.1 Founder Twin

- 战略目的：让新世界与对象主要由 declaration 产生，减少重复引擎胶水，同时维持 RFE/RNCS 的现实主权。
- 不可牺牲：authority 不得下沉给 VSR、codegen 或模型；高风险现实变化仍走 proposal → policy/authority → commit。
- 裁决：先建立可逆、并行、可差分的候选路径，不直接替换生产路径。

### 2.2 柳清莲 Gate

- 价值门：产物必须能运行、能测试、能继续生成代码；纯概念文档不算完成。
- 克制门：不重写整套引擎，不用“统一”掩盖未验证能力。
- 裁决：通过，范围限于 v0.1 核心 + PoC + 真实专项差分。

### 2.3 洞哥 Grounding

- 真实地面：RSR 是整数确定性参考求解器，VSR 有 CPU/reference 与 fake-device WebGPU 证据，但无本次真实 GPU 证明。
- 最弱依赖：干净 workspace 构建、真实包导入、当前 schema 的松散字段以及陈旧历史文档。
- 裁决：所有 theorem 必须声明适用域和证明种类；不能把模型性质外推到 PhysX/Jolt/Chaos/浏览器 GPU。

### 2.4 产品文明

- 用户输入应收敛为一份声明；生成物可检查、可追踪、可重建。
- 首个垂直切片：一个带权威物理身体、视觉身体、插值策略、资产绑定、观察者策略和事件路由的实体。
- 成功指标：生成结果确定、重复胶水显著下降、错误在生成前失败。

### 2.5 UX / 设计文明

- 声明字段采用领域名称，不暴露 GPU barrier 或 solver 内部细节给普通世界作者。
- 诊断必须返回稳定错误码、JSON Pointer 路径、违反的不变量和修复提示。
- 生成 manifest 必须能追溯输入 root、generator 版本与各产物 root。

### 2.6 数学与形式方法文明

- 采用五级结构：L1 对象/类型；L2 状态空间与不变量；L3 转移；L4 定理与可执行 witness；L5 与生产实现的 refinement/differential relation。
- 定理分类：`EXACT`、`BOUNDED_NUMERIC`、`CONDITIONAL`、`PROPERTY_TESTED`、`UNVERIFIED_EXTERNAL`。
- 证明不是一段说明文字；每项需有 machine-checkable predicate、assumptions、witness 或明确未证明标签。

### 2.7 物理模拟文明

- 保留现有积分器、碰撞检测、约束求解、warm start、sleep/wake 和角色控制器。
- IR 只统一身体语义、单位、形状、过滤、事件和 root 映射。
- 四元数用于 IR 的规范旋转；对现有 RSR 欧拉接口生成有界适配，标记奇异点与量化条件。

### 2.8 图形渲染文明

- 保留 mesh、material、shader、PBR、texture decode、GPU backend。
- 新增 render graph 的显式 read/write/create/import/export、lifetime、queue、barrier 与 alias 约束。
- backend 等价仅可在执行过的 observable 范围内声称；没有真实 GPU 像素证据时保持未验证。

### 2.9 网络与分布式文明

- generation/revision/tick/root 是不同维度，不可互换。
- authoritative snapshot/delta 的 base root、target root、对象 bodyRoot 与重放命令窗口必须保持可验证。
- 插值/预测只改变 presentation；回滚以权威 snapshot 为基线，不允许 VSR 反写 authority。

### 2.10 工程文明

- 新模块不引入运行时第三方依赖，使用 Node 标准库和现有 workspace。
- 先旁路生成与差分，再考虑替换手写适配器。
- 每个包有独立测试入口、README、schema、示例和失败闭合行为。

### 2.11 代码文明

- 规范化散列、错误模型和 theorem receipt 只实现一份公共核心。
- 所有生成文件带输入 root 与 generator root，不接受无来源手改后仍自称 generated。
- 不使用 `eval`、动态任意导入或声明中的可执行代码。

### 2.12 测试文明

- 单元：每个不变量至少一正一负；确定性至少双运行同根。
- 变形：输入顺序、四元数同构符号、事件重复、render graph 环和非法资源使用。
- 集成：World Declaration → IR → codegen → 真实 RSR → authority frame → 真实 VSR temporal/frame。
- 差分：reference result 与 production result 分栏记录；任何跳过均不得计 PASS。

### 2.13 安全文明

- 输入大小、数量、标识符、整数范围和图深度有上限；循环、重复 ID、未知 capability 失败闭合。
- generated artifacts 只写入显式输出目录；禁止路径穿越。
- codegen 不能调用 authority commit；只能产生 candidate artifacts 和验证回执。

### 2.14 发布文明

- 新包使用独立 `0.1.0-alpha.1`；不无意义改写 RSR/VSR 当前版本。
- 更新 module registry、root scripts、lockfile/文档，并运行版本契约。
- 发布说明明确已验证命令、未执行项、回滚方法与成熟度裁决。

### 2.15 Integration Court

合并前必须同时满足：

1. authority/presentation 非干扰测试通过；
2. 所有七类根对象可被 schema 与 runtime validator 验证；
3. codegen 两次输出字节相同；
4. 至少一个真实 RSR→VSR 垂直差分通过；
5. 所有负例真正失败；
6. 证据账本只引用本次生成回执；
7. 未执行 GPU/VM/平台项明确为 `UNVERIFIED`。

### 2.16 Evidence Ledger

- 每个 claim 使用稳定 ID：`WBIR-*`、`RSR-*`、`VSR-*`、`WB-*`、`RCL-*`、`CODEGEN-*`、`DIFF-*`。
- 每条记录：claim、classification、command、artifact root、result、scope、limitations。
- 证据级别：`STATIC_INSPECTION` < `REFERENCE_EXECUTION` < `PRODUCTION_DIFFERENTIAL` < `EXTERNAL_BACKEND`。
- 历史 README/manifest 仅作 provenance，不自动继承为当前 PASS。

**联邦总裁决：** `PROCEED_AS_CANDIDATE`。只授权下述最短闭环，不预授权删除旧路径或宣布 F5。

## 3. 现有 RSR / VSR 能力盘点

| 层 | 已存在能力 | 当前边界 | WBIR 连接点 |
|---|---|---|---|
| RSR state | 定点位置/欧拉旋转、shape/fixture/body、snapshot roots | 没有统一 entity generation/revision/provenance | `PhysicalBody` + `AuthorityState` |
| RSR transition | 固定步、碰撞/接触、joint、warm start、sleep、character | 参考求解器，不等价于商业物理后端 | RSR L3/L4 witness |
| RSR network | authority frame、bodyRoot、delta、history、reconcile | 对 BodyMap/视觉偏移无统一契约 | `TemporalPresentationState` |
| VSR temporal | hold/interpolate/extrapolate/snap、correction | 欧拉与整数域；presentation 仅隐式映射 | `TemporalPresentationState` + `BodyMap` |
| VSR spatial | scene、PBR、glTF、frame plan、CPU reference、WebGPU encoding | pass/resource 语义不足以证明 DAG hazard/lifetime/barrier | `VisualBody` + `RenderGraphIR` |
| Assets | mesh/material/texture/streaming receipts | asset version/lifetime 与实体根未统一 | `AssetState` |
| Observer | camera/observer policy/profile | 可见性与权限/LOD 证据分散 | `ObserverState` |
| Events | physics contacts/sensory + VSR interaction/animation | 同一事件可能被多处重新生成 | `WorldEventState` |

## 4. 重复表示与偶然复杂度盘点

预期统一的重复代码类型：

1. entity ID、generation、revision、root 的跨包重复封装；
2. RSR body/fixture 到 VSR node/mesh/material 的手写映射；
3. position/rotation/scale 与单位换算；
4. authority snapshot、network packet、temporal packet 的重复 shape 转换；
5. visual offset、插值、snap、回滚策略的对象级 glue；
6. physics event→animation/audio/haptic/VFX 的重复路由；
7. render pass 顺序、资源创建/销毁、hazard 和 barrier 的手写模板；
8. 每个产品重复维护的 schema、root、版本和 provenance 字段；
9. 测试 fixture 与产品 world config 的双份定义；
10. 后端适配器对同一语义计划的重复分支。

## 5. World Body IR 边界

### 七类根对象

1. `AuthorityState`：world/entity generation、revision、authority root、source commit/proposal、capability scope。
2. `PhysicalBody`：坐标系、单位、transform、motion、mass/inertia、fixtures、filters、constraints。
3. `VisualBody`：节点层次、mesh/material、物理绑定、visual-only offset、visibility/shadow/LOD。
4. `TemporalPresentationState`：sample clock、delay、extrapolation bound、correction、history/rollback contract。
5. `AssetState`：asset/version/content root、residency、lifetime、import receipt。
6. `ObserverState`：observer identity、view/culling policy、quality/capability，不拥有 world authority。
7. `WorldEventState`：authoritative event identity、source tick/root、consumer routes、exactly-once key。

### 明确不拥有

- RFE/RNCS commit authority；
- 真实世界或持久化状态的最终写入；
- 物理求解器、Shader、GPU 驱动、网络传输、数据库或平台设备实现；
- 自动宣称任意 backend 的语义/像素/性能等价。

### BodyMap 核心律

```text
worldTransform(visualNode, t)
  = present(authorityTransform(physicalBody, sample(t)), temporalPolicy)
    compose visualOnlyOffset(visualNode)
```

- `visualOnlyOffset` 不得进入 RSR authority hash。
- presentation/frame root 必须绑定 authority source root，但不得等同或覆盖它。
- 没有 `physicalBodyRef` 的 presentation-only entity 必须显式声明，不可伪装为 authoritative body。

## 6. 形式化与生产代码对应路线

| 形式层 | 可执行产物 | 生产映射 | 证据 |
|---|---|---|---|
| L1 对象 | JSON Schema + validator | RSR/VSR types/manifests | schema/negative tests |
| L2 不变量 | predicate registry | snapshot/frame validators | mutation tests |
| L3 转移 | reference transition functions | RSR step/reconcile、VSR sample/compile | replay/property tests |
| L4 定理 | theorem registry + witness receipt | targeted runtime adapters | machine receipts |
| L5 refinement | differential harness | real RSR/VSR exports | paired roots/observables |
| 联合理论 | WB theorem suite | authority→network→presentation | end-to-end differential |
| RCL kernel | canonical RCL source + compile manifest | existing RCL toolchain, if executable | native/parity receipt or `UNVERIFIED` |
| codegen | deterministic generated modules | world-specific specialization | byte identity + execution |

## 7. 验收标准

### 必须通过

- IR 七根对象、BodyMap、RenderGraphIR schema/runtime validation。
- RSR/VSR/联合 theorem registry 完整且每项有 classification 和 assumptions。
- 至少 20 个正负不变量测试；负例不得通过。
- codegen 输入顺序归一化并两次生成同 root/同字节。
- 真实 RSR snapshot/frame 与真实 VSR temporal/frame 的专项差分闭环。
- authority state 在 VSR 投影前后 root 不变。
- render graph 拒绝 cycle、read-before-write、unordered write conflict、非法 alias/lifetime。
- evidence ledger 可由命令重新生成并验证自身 root。
- workspace 专项测试、authority-presentation 集成、版本契约通过；不能运行的项必须显式记录。

### 成熟度裁决

- `Candidate`：结构和 reference tests 可运行，但无生产差分。
- `F4 Verified`：形式谓词、witness 与联合 reference 闭包通过。
- `F4.5 Partial Production Parity`：F4 + 至少一个真实 RSR/VSR 差分闭环；外部 VM/GPU/平台仍部分未验证。
- `F5 Differentially Verified`：必须有封印的 `FULL_PRODUCTION_DIFFERENTIAL`，且真实 VM/GPU、外部物理、真实网络、生产资产与目标硬件等每个规定门均有唯一、封印、独立的外部后端 PASS。
- `Blocked`：关键依赖使最小闭环不可执行，或失败无法安全规避。

## 8. 风险与回滚

- 所有新模块为独立 workspace；回滚可删除 module registry 条目、root scripts 与新目录，不触碰 RSR/VSR 内核。
- v0.1 默认不替换 `spatialEmbodimentSnapshotToVSRScene`；只提供生成等价候选并做差分。
- 若生产差分不一致，保留失败 fixture 与 receipt，整体最高裁决退回 `F4 Verified` 或 `Candidate`。
- 若真实 RCL native toolchain 无法执行，RCL 源和静态契约保留候选，绝不把 JavaScript parser 结果写成 native VM PASS。
- 若真实 GPU 不可用，render graph 只裁决图语义；pixel/backend claim 为 `UNVERIFIED_EXTERNAL`。

## 9. 不可证明部分

- 浮点/驱动/硬件上的逐像素或逐位跨 GPU 一致性；
- 未执行的浏览器 WebGPU、Unity、Unreal、PhysX、Jolt、Chaos 后端等价性；
- 任意复杂碰撞、软体、流体、布料、完整 GI/TAA/XR 的正确性；
- 网络在真实丢包、乱序、攻击与跨地区时钟漂移下的生产 SLA；
- RCL 全语言、native VM 与本形式内核的完整语义同一，除非本次真实执行并差分；
- 定理适用域之外的连续物理真理与现实世界真值。

## 10. 不应删除的必要底层代码

1. broad/narrow phase、GJK/EPA/SAT、manifold、solver、joint、sleep/wake；
2. Shader/WGSL、PBR/纹理采样、mesh/animation、CPU reference rasterizer；
3. WebGPU/Canvas/null backend 与真实资源上传/command encoding；
4. 网络传输、拥塞/重试、序列化、历史缓冲、prediction/reconciliation；
5. RFE/AAF/RBF/ICAR/RNCS authority、commit、rollback 与审计存储；
6. RCL compiler/VM/Provider ABI；
7. 文件系统、数据库、设备、浏览器和平台适配器；
8. backend-specific performance tuning 与诊断。

## 11. 最短实施序列

1. 建立 `@taowind/world-body-ir`：七根对象、规范化、schema、validator、root、BodyMap、RenderGraphIR。
2. 建立 RSR/VSR 五级 theory 包：定理清单、可执行谓词、witness/negative tests。
3. 建立联合 theory：authority non-interference、event identity、snapshot/rollback、branch/observer isolation。
4. 建立 RCL formal kernel：可审计源、生成/编译 manifest；native 执行取决于真实 toolchain。
5. 建立 `world-body-codegen`：声明→RSR/VSR/temporal/network/render graph 生成物。
6. 运行真实 RSR/VSR 差分；生成 evidence ledger。
7. 更新 module registry、root scripts、README/CHANGELOG/release note/rollback。
8. 完成专项、集成、版本、安全/secret 检查，提交、推送、PR。

## 12. 停止条件

- 任何生成物能绕过 authority commit：立即停止并回滚该路径。
- reference 与 production 不一致且无法缩小到明确适用域：不得高于 `Candidate`。
- 没有实际命令回执：不得使用 `Verified` 或 `Parity`。
- 真实后端未执行：不得使用 F5。
