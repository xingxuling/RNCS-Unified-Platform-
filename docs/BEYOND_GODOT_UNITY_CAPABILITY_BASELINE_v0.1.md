# Beyond Godot and Unity: Capability Baseline v0.1

本文档把“超越 Godot 和 Unity”拆成可验证的产品工程目标。它不把单点技术优势等同于完整引擎能力，也不要求 RNCS 复制传统引擎的全部内部实现。

## 1. 产品判断

Godot 和 Unity 的基线优势是成熟的编辑器、资产导入、渲染、物理、动画、音频、脚本、调试和发布链路。RNCS 当前真正有机会形成结构性领先的方向是：

- RCL 把世界规则、权限和因果状态编译成可验证的运行时事实。
- RNCS 把空间、视觉、网络、权威提交和原生执行组织成统一运行时。
- zhinao 把智能主体、长期记忆、社会规则和世界演化接入同一条执行链。

因此，目标不是“做一个功能相似的编辑器”，而是同时完成两条曲线：先达到可用的引擎基线，再让世界规则、智能主体和可审计因果成为默认能力。

## 2. 能力矩阵

| 能力面 | Godot / Unity 基线 | 当前 RNCS / RCL / zhinao 事实 | 超越门槛 | 状态 |
| --- | --- | --- | --- | --- |
| 语言与运行时 | 脚本语言、热更新、调试器 | RCL native-core Stage40 已通过原生 VM 验证；完整语言运行时仍非全自托管 | 规则、权限和世界状态可由 RCL 编译，并在原生运行时重放一致 | 差异化已存在，继续扩展 |
| 场景与编辑器 | 场景树、Inspector、视口、实时预览 | RNCS 已有运行时分层，完整创作编辑器仍需建设 | 新建世界到可运行预览小于 5 分钟，编辑过程不丢失规则证据 | 缺口 |
| 资产管线 | 2D/3D 导入、材质、动画、音频、依赖管理 | RSR/VSR 已可构建并纳入运行时健康检查 | GLB/PNG/音频/动画导入、依赖锁定、增量构建和运行时检查形成一键闭环 | 基础已在，需产品化 |
| 空间与视觉 | 2D/3D 渲染、相机、光照、材质 | 空间、视觉状态、具身运行时已纳入 RNCS | 同一份世界状态驱动视图、回放、远程观察和无头模拟 | 基础已在，需垂直切片 |
| 物理与模拟 | 刚体、碰撞、导航、动画状态机 | RSR 已有约束物理、具身动力学、空间具身与体验织物测试 | 物理、规则、智能主体和网络重演共享同一时间线与状态哈希 | 基础已在，需统一证据 |
| 网络与多人 | 复制、房间、预测、回滚、服务端权威 | RNCS 网络与权威提交链路已纳入 17/17 runtime health | 断线恢复、回滚重演、权限拒绝和最终状态哈希全部可审计 | 运行时已在，需规模基准 |
| 智能世界 | 传统引擎通常把 AI 作为插件或游戏逻辑 | zhinao 提供 GameBrain、长期演化和世界提案执行层 | 主体能感知、推理、协作、受规则约束并留下可回放因果链 | 独特优势，需可玩化 |
| 权威与治理 | 权限多由业务代码自行实现 | RCL control plane 支持 native execution、parity verification、authority plan/commit | 每个高影响世界变更都有 warrants、证据、审批、回滚和重放 | 差异化已存在，继续标准化 |
| 发布与部署 | 桌面、移动、主机、Web 导出模板 | 当前重点是工作区与 runtime 构建闭环 | 一个世界包可生成客户端、无头服务器、回放包和审计报告 | 缺口 |
| 生态与扩展 | 插件、资产商店、文档、社区工具 | 三仓库已形成 RCL -> RNCS -> zhinao 分层 | SDK、扩展契约、版本兼容矩阵和可验证样例成为第三方入口 | 缺口 |

## 3. 可量化验收门槛

### G0: 可复现底座

- RNCS `npm run health` 为 `healthy`，17/17 runtime healthy。
- RCL version contract 通过，canonical source 与 release boundary 可验证。
- zhinao `npm run verify:vendor-rcl` 通过，并包含原生 Stage40 报告。
- 三仓库测试、构建和 vendored snapshot 不依赖人工复制或管理员权限。

### G1: 可玩世界垂直切片

一个新世界必须能在同一条工作流中完成：导入至少一种 3D 资产和一种音频资产、打开视口、生成一个 RCL 规则、放入一个智能主体、连接两名客户端、执行一次权威提交、断线后重演，并导出客户端、无头服务器和审计报告。

验收证据至少包含：

- 资产来源与依赖锁定记录。
- 世界规则的 RBC 指纹与版本。
- 客户端和服务器的状态哈希一致。
- 预测、拒绝、提交、回滚和重演事件链。
- 智能主体决策的输入、提案、授权和结果。

RNCS 现在保留两个可重复入口：`npm run test:beyond-engine` 是 v0.1 兼容原型，`npm run test:beyond-engine:v02` 是 G1 主权世界包验收。v0.2 使用真实相邻 zhinao GameBrain Provider，执行五平面语言认知、正式 RNCS Proposal/Authority/Commit、真实 GLB/WAV 导入、双客户端断线恢复，并从同一项目根和 timeline 导出 web 客户端、Windows 便携包、无头服务器与 replay bundle。缺少真实 GameBrain 模块时 v0.2 会明确失败，单仓 CI 只能标记跨仓测试跳过，不能用 mock 冒充完成。

### G2: 引擎基线

- 场景树、Inspector、视口、运行时调试和热重载可用。
- GLB/PNG/音频/动画拥有可增量构建的导入管线。
- 物理、导航、动画、音频和网络使用统一世界时间线。
- Windows 首发包可一键生成客户端、服务器和回放包。

### G3: 结构性超越

- 世界规则和权限不是外挂脚本，而是 RCL 的一等编译对象。
- 智能主体不是单个 NPC 功能，而是可持续运行、协作和演化的世界参与者。
- 高影响变更默认具备可审计授权、确定性重演和人类最终裁决。
- 同一世界可在实时客户端、无头模拟、训练环境和历史回放之间切换，且状态证据不分叉。

## 4. 交付顺序

1. P0: 固化三仓库版本、构建、健康检查和 vendor 验证；保持每次同步可复现。
2. P1: 完成一个“城镇生活 + RCL 规则 + 智能主体 + 双客户端”的可玩垂直切片。
3. P2: 补齐编辑器最小闭环：场景树、Inspector、视口、资产导入、规则编辑和运行时调试。
4. P3: 补齐发布闭环：客户端、无头服务器、回放和审计包的统一导出。
5. P4: 用规模、确定性、恢复时间和创作耗时基准证明 G3，而不是用功能清单宣称超越。

## 5. 当前验证入口

```text
RNCS:   npm run health
RCL:    npm run verify:version-contract
zhinao: npm run verify:vendor-rcl
zhinao: npm test
RNCS:   npm run test:beyond-engine
RNCS:   npm run test:beyond-engine:v02
RNCS:   npm run demo:beyond-engine:v02
```

本矩阵是 v0.1 基线。每完成一个 G 门槛，应补充真实运行证据、基准数据和失败样例，再更新状态；不能仅凭设计文档把“缺口”改成“已完成”。

## 6. Verified Progress v0.2

The following evidence is now present in the current worktree:

- Reality Studio unified runtime: 210/210 workspace tests pass. The editor
  session exposes a content-addressed runtime timeline with step, replay, seek,
  branch truncation, checkpoint restore, and exported deterministic receipts.
- Reality Studio CLI smoke: runtime-timeline-demo produces a non-empty timeline,
  stable checkpoint ID, replay root, and deterministic=true.
- Reality Build: a single build request can emit web-release, web-single,
  windows-portable, android-project, headless-server, and replay-bundle. Root
  and file-based targets carry runtime evidence, replay, and checkpoint files.
- Replay verifier: the generated replay bundle independently reproduced the
  expected replay root with deterministic=true.
- Headless server: the generated server executes the same build trace with the
  same runtime session and checkpoint identity as the replay bundle. Its
  `/health` and `/replay` roots now match the build evidence rather than an
  empty headless timeline.
- Network runtime: 22/22 tests pass, including prediction, rollback, packet
  loss convergence, authorization rejection, recovery candidates, and RSR v0.7
  authority proofs. The local benchmark currently reports 29.18 effective
  ticks per second for the two-player full simulation and 35,170 packets per
  second in the 50-player protocol queue benchmark.

The v0.2 sovereign-world workflow additionally verifies a real zhinao
Foundation cognitive loop, canonical RNCS 4R commit, deterministic GLB/WAV
asset baking, two-client disconnect recovery, and executable client/headless/
replay targets under one package root. This closes one G1 workflow; it does not
yet prove a production-grade visual editor, general project-to-network world
 compilation, multiplayer scale beyond the current benchmark envelope,
 store-signed release packages, complete RCL Native VM lowering, or full G2/G3.

## 7. Verified Progress v0.3

G2 now has one real Studio-to-authority workflow:

- Reality Studio compiles its active scene, GLB bindings, RSR bodies,
  characters, player slots, authority policy, and deterministic network profile
  into a content-addressed `network-world-compilation`.
- Reality Network independently verifies the compilation, world-config,
  evidence, and asset-binding roots before creating the authoritative world.
- Server joins reject missing, mismatched, duplicate, occupied, or forged
  player/body/character/subject bindings.
- Two clients converge under deterministic latency, jitter, packet loss,
  duplication, and reordering. An input created while disconnected is retained
  and commits exactly once after reconnect.
- The authoritative snapshot renders the authored GLB meshes into a verified
  VSR PNG. Recompiling from a fresh Studio project instance produces the same
  project and compilation roots, while repeating the same network session
  produces the same final State Root and network evidence root.
- A Studio body edit changes the project root, world-config root, compilation
  root, and initial authoritative State Root, proving that editor mutation is
  connected to runtime authority rather than being presentation-only.

Current verification is 216/216 Studio tests, 25/25 Network tests, 109 Build
passes with eight environment skips, 555 RCL passes with one environment skip,
20/20 Foundation conformance checks, and 152 zhinao passes across 23 files.
Regenerate with `npm run demo:studio-network:v03` and verify with
`npm run test:studio-network:v03`.

This closes the specific project-to-network compilation gap named in v0.2. It
does not yet prove complete editor parity, public-WAN multiplayer scale,
native-rendered desktop/mobile distribution, or full stack superiority over
every Godot and Unity workflow.

## 8. Verified Progress v0.4

RCL Foundation Native Batch A is now connected to RNCS authority instead of
ending at a language-runtime receipt:

- Six modules execute as RBC 1.2 through `RclVmProviderV1` in bridge mode:
  quantitative, knowledge, perception, natural-language, understanding, and
  creative reality.
- Their standard Foundation results compile into one deterministic RNCS
  Proposal whose evidence root binds the Native receipt, bytecode root, causal
  chain, and final candidate root.
- Candidate approval and commit confirmation are separate gates. Missing
  Provider, denied RCL authority, unstable AIF, incomplete evidence, missing
  human approval, and incomplete RNCS 4R governance all fail closed.
- The committed RNCS generation root must equal the verified RCL final state
  root; a caller cannot substitute a different commit root.
- Reality One Gateway now discovers `rncs.rcl-foundation-native` as one of 18
  healthy runtimes. Its `prepare`, `authorize`, and `commit` actions preserve
  the same separated authority gates; Gateway preparation cannot auto-commit.

Verify with `npm run test:foundation-native-rncs` and regenerate the rooted
evidence with `npm run evidence:foundation-native-rncs`. The unified runtime
path is covered by `npm run test:integration` and `npm run health`.

This closes one language-to-authority integration gap. It does not make the
remaining Foundation modules native, remove the JavaScript Reference Runtime,
or prove complete editor/distribution parity with Godot and Unity.

## 9. Verified Progress v0.5

RCL Foundation Native Meta Batch B now continues the Batch A generation
through RNCS and Reality One Gateway:

- `meta-spacetime` commits a bounded causal timeline transition.
- `meta-acceleration` records requested and effective factors, caps execution
  at 8, and preserves the fidelity floor as deterministic RNCS data.
- `meta-compression` binds reversible 64-byte-to-32-byte content-root packing
  and exact restore proof into the proposal.
- Every semantic operation carries its structured parameters and parameter
  root. A total semantic state root is repeated in RNCS 4R governance,
  extensions, verification output, and evidence.
- Batch A generation 1 becomes Meta Batch B's causal base; Meta commits as
  generation 2 only after separate human approval and commit confirmation.
- Gateway selects the batch during `prepare` and still requires distinct
  `authorize`, `commit`, and `verify` calls.

The deterministic evidence is regenerated with
`npm run evidence:foundation-native-rncs`; scoped canonical RCL source is
checked with `npm run verify:foundation-native-rcl-source`.

This verifies nine Foundation entries through Native Provider bridges and RNCS
authority. It still does not implement declared Foundation syntax lowering,
the remaining domains, or full Godot/Unity workflow parity.

## 10. Verified Progress v0.6

RCL Foundation Native Batch C now connects two engine-facing Foundation domains
to the same RCL Native VM and RNCS authority path:

- `physical` executes a bounded deterministic semi-implicit step with explicit
  tick, timestep, body count, and contact budget variables.
- `embodiment` executes after `physical` and carries the physical result's
  `afterRoot` as its required causal parent.
- Both results are standard Foundation results, replay-checked, and compiled
  into RNCS provisional deltas with semantic parameter roots.
- Batch C remains `bridge` mode. It does not claim declared Foundation syntax
  lowering or native physics/embodiment language semantics.

This verifies eleven Foundation entries through three Native Provider bridges.
Nine base domains and two composite planes remain without direct standard-result
invocation in RNCS. The Godot/Unity gaps in editor workflow, asset authoring,
production networking scale, platform distribution, and ecosystem depth remain
open.

## 11. Verified Progress v0.7

RCL Foundation Native Batch D now adds a third engine-facing causal chain to the
same Native VM and RNCS authority path:

- `energy` performs bounded integer milli-joule transfer with capped loss,
  remaining budget, tick mutation, and explicit clamping.
- `elemental` validates material, mass, purity, temperature, and energy-use
  parameters, then binds `energyParentRoot` to the preceding energy result.
- `neural` validates signal, amplitude, memory, attention, and inhibition
  budgets, then derives retained memory and a deterministic control score while
  binding `elementalParentRoot`.

Batch D is registered as a fourth `RclVmProviderV1` bridge and is compiled into
RNCS Proposal/Authority/Commit with separate human approval and commit
confirmation. Canonical RCL source synchronization now covers 22 files from
RCL main commit `0857429`; the four-generation evidence chain ends at generation
4. RCL and the vendored RNCS conformance harness both report 78/78 checks,
RNCS Foundation integration reports 22/22, Gateway reports 26/26, and the
rooted four-batch evidence report has 19/19 checks passing.

This verifies fourteen Foundation entries through four Native Provider bridges:
the remaining six base domains and two composite planes still lack direct
standard-result invocation in RNCS. All four batches remain `bridge` mode;
declared Foundation syntax lowering, a production editor, full asset/rendering
parity, public-WAN scale, platform distribution, and ecosystem depth remain
open. This is measurable runtime progress, not a claim of complete Godot/Unity
 replacement.

## 12. Verified Progress v0.8

RCL Foundation Native Batch E now connects the computation substrate to the
same Native VM, RNCS authority, and Reality One Gateway path:

- `metacomputation` bounds a selected plan by requested and maximum step
  budgets, records clamping, and advances a deterministic planning tick.
- `computation` executes bounded sum, difference, or product operations with
  an instruction budget and binds `metacomputationParentRoot` to the plan.
- Both results are standard Foundation results with semantic parameter roots,
  replay verification, invalid-input rejection, and separate human approval
  and commit confirmation.

Batch E is registered as the fifth `RclVmProviderV1` bridge. Canonical RCL
source synchronization now covers 25 files from RCL main commit
`9d6a5e133a459bd9322fcef9514abbb9dddbfd88`; the five-generation evidence chain
ends at generation 5 with evidence root
`fed41df8555ae41dc9e1220bf74fa983c738f0cc017074c991c3c588e9be5fa2`.
RCL and the vendored RNCS conformance harness report 93/93 checks, RNCS
Foundation integration reports 26/26, and the rooted five-batch evidence
report has 21/21 checks passing.

This verifies sixteen Foundation entries through five Native Provider bridges.
The remaining four base domains and two composite planes still lack direct
standard-result invocation inside RNCS. All five batches remain `bridge` mode;
declared Foundation syntax lowering, a production editor, complete
asset/render/audio/animation parity, public-WAN scale, platform distribution,
and ecosystem depth remain open. This is measurable runtime progress, not a
claim of complete Godot/Unity replacement.
