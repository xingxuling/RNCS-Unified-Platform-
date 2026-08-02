# Unreleased — World Body Formal Kernel v0.1 Candidate

- Added `@taowind/world-body-ir` with seven sealed root objects, total BodyMap validation, fixed-point transform rules, and an explicit hazard/lifetime/barrier Render Graph contract.
- Added executable five-level RSR and VSR theorem suites plus WB-T1 through WB-T10 joint theory; external-engine and real-GPU theorems stay explicitly `UNVERIFIED`.
- Added an RCL World Body kernel and real reference/native-VM parity evidence for its exercised subset without moving RNCS commit authority into RCL or code generation.
- Added `@taowind/world-body-codegen`: one World Declaration deterministically emits WBIR, RSR configuration, VSR/temporal bindings, render/event plans, and an RCL candidate artifact.
- Added a selected production differential through the actual RSR `0.9.0-alpha.1` and VSR `0.8.0-alpha.1` exports. This is F4.5 partial production parity, not real GPU, external physics, distributed-network, provider, or target-hardware equivalence.
- Added reproducible evidence generation and `npm run verify:world-body`; no existing suite, RSR, or VSR version was rewritten.

# v0.19.8-alpha.1 — RCL Native Gateway Fusion

- 统一 release manifest、根 package/lockfile 与模块登记的版本契约，并新增 `npm run verify:version-contract`。
- 修正 Reality Behavior Fabric、TaoWind Reality MCP、Reality Studio、Reality Build Fabric 与 Aetherworld 的模块版本登记，使其与各自 `package.json` 对齐。
- 将 execution-plane CI 的 push 触发覆盖默认分支 `main-95`，并把版本契约验证纳入该工作流。
- RCL canonical-source 关系和 zhinao vendored snapshot 状态见 `docs/migration/`；本版本不宣称跨仓库字节级同一。

# v0.19.7-alpha.1 — Aether Earth RCL 集体智能地球沙盒

- 新增 `@taowind/aether-earth-runtime` 与 `rncs.aether-earth`。
- 新增 16×16/256 瓦片世界、100 个持续少数据主体、4 类气候与 4 类原型。
- 新增 512+ 条带证据、置信度、修订和冲突字段的 RCLpedia。
- 新增 1×/10×/100× 逻辑时间、确定性 seed、Reality Root 与无损压缩胶囊。
- 新增集体智能结晶：群体观察聚合 → RCL 源码 → RBC → 原生 VM 隔离验证 → 策略晋升。
- 新增离线浏览器控制台与 Android Studio 源码工程；前台服务持续推进，JobScheduler 离线补算。
- RCL 控制平面扩展至 12 模块/11 条依赖边；RNCS runtime 增至 16。
- 验证：Aether Earth 12/12、RCL 70/70、控制平面 7/7、RNCS integration 36/36、release valid。
- Android SDK/Gradle 不存在于交付容器，未伪造 APK。

# v0.19.6-alpha.1 — RCL 嵌入式长驻 VM 与 11 模块控制平面

- RCL 升级到 `0.12.0-alpha.1`；Native VM 升级到 `0.6.0-alpha.1`。
- 新增 `librclvm.a`、`librclvm.so`、`rclvmd` 和可重复运行的实例生命周期 API。
- 新增 Provider ABI v1 与 `CALL_PROVIDER` 原生指令。
- RNCS RCL 控制平面扩展到 11 个模块和 10 条依赖边。
- 新增单份 AOT Bundle、daemon 热回放和同进程直接嵌入基准。
- 当前环境直接嵌入约 `0.0036 ms/run`，长驻 daemon 约 `0.59 ms/run`；端到端 RNCS 尚未自动获得同倍率。
- RCL 70/70、控制平面 7/7、RNCS integration 34/34 通过；runtime health healthy。

# v0.19.5-alpha.1 — RCL Stage-5 与 RNCS 控制平面 RCL 化

- RCL 升级到 `0.11.0-alpha.1`；Native VM 升级到 `0.5.0-alpha.1`。
- 新增原生字节编码 primitives 与 `sequence_concat`。
- RCL 在原生 VM 内精确编码 RBC 1.1，输出与 Stage-0 reference encoder 逐字节一致。
- 新增 `@taowind/rncs-rcl-control-plane`。
- Core、RFE、AAF、Branch、Behavior、ICAR、CNP 建立可执行 RCL 语义镜像与依赖边验证。
- 新增单份 AOT 控制平面 RBC bundle。
- RCL 66/66、控制平面 6/6、RNCS integration 34/34 通过；runtime health healthy。
- 性能基准确认当前子进程式 VM 尚无小任务性能优势，后续需嵌入式长驻 VM。


## 0.19.3-alpha.1

- Integrated RCL 0.9 Stage-3 semantic self-hosting core.
- Added native Symbol, SemanticNode and IrNode values to C VM v0.3.
- Added RCL-authored symbol resolution, duplicate detection, type checking and typed IR lowering.
- Added RNCS-to-RCL rewrite gates and dual-run migration route.
# v0.19.2-alpha.1 — RCL Stage-2 自托管核心

- RCL 升级至 `0.8.0-alpha.1`；
- RBC 升级至 1.1，C 原生 VM 升级至 0.2；
- 新增 Sequence、Span、Token、AstNode、ParseState 原生值；
- 新增递归调用栈与局部参数；
- RCL 自身实现 tokenizer 和核心 facet parser；
- 建立 Stage-0 / Stage-2 AST parity 与畸形源码拒绝测试；
- 当前仍由 Stage-0 JavaScript 负责引导编译及 RBC 二进制序列化，未声明完整自托管。

# Changelog

## 0.19.1-alpha.1

- Integrated RCL `0.7.0-alpha.1` Native VM Bootstrap.
- Added deterministic `RBC 1.0` bytecode and disassembler.
- Added C11 `rclvm` native execution kernel for core reality transactions.
- Verified state, authority, transaction and SHA-256 reality-root parity with the reference runtime.
- Added an RCL-authored Stage-1 self-hosting compiler seed.
- RCL test total increased from 40 to 46, all passing.
- Preserved the complete fourteen-domain Node.js reference runtime; unsupported native Provider domains are rejected explicitly.

## 0.19.0-alpha.1

- Integrated RCL 0.6.0-alpha.1 Foundation Closure.
- Added energy, element, science, embodiment and spirit realities.
- Expanded foundation from nine to fourteen reality domains.
- Added 7 regression tests; RCL total is now 40/40 passing.
- Preserved cognition and meta-runtime planes.
- Runtime health verified after local workspace bootstrap.

# v0.18.9-alpha.1

## RCL v0.5 Meta Reality Foundation

- 新增元时间空间现实：参考系、时钟、坐标、同步和因果环检测；
- 新增元加速现实：精确记忆化、fidelity 与 budget 契约；
- 新增元压缩现实：无损 Deflate、reality root 验证、删除后恢复；
- RCL 语言版本升级到 `0.5.0-alpha.1`；
- RCL 测试从 28 项增加到 33 项，全部通过；
- 母工程 runtime health 保持 `healthy`。

---

# v0.18.8-alpha.1

- RCL 升级到 v0.4.0-alpha.1。
- 新增 Natural Language Reality、Understanding Reality、Creative Reality 三个复合运行平面。
- 增加 `Utterance`、`Intent`、`Understand<T>`、`Create<T>` 类型与对应编译/运行语义。
- 自然语言、理解与创造保持候选态，必须经过权界与正式提交才能改变外部现实。
- 增加中文命令认知闭环示例，RCL 28/28 测试通过，母工程健康检查为 healthy。

# v0.18.7-alpha.1

- RCL 升级到 v0.3.0-alpha.1。
- 增加第九现实域 Knowledge Reality。
- 增加知识形成、推理、修订、冲突保留与遗忘。
- 增加 Inner Reality 与 Execution Reality 组合平面。
- 增加少数据 AI 示例与 22/22 自动测试。

# v0.18.2-alpha.1

- 修复Godot诊断页无限停留。
- 增加线程化场景读取、启动双超时与阶段进度。
- 将同步世界生成重构为分阶段流送。
- 树木和岩石改为低多边形MultiMesh批处理。
- 敌人和NPC分批跨帧生成。

# v0.18.1-alpha.1

- 修复Godot原生工程运行即关闭。
- 增加Bootstrap诊断场景和启动日志。
- 重构玩家、HUD、敌人和NPC脚本实例化。
- 增加跳跃、三段连招、击退、名牌、锁定HUD与昼夜推进。
- Open World Runtime升级至0.2.0-alpha.1，14项测试通过。
- 新增64项Godot静态回归检查。

## 0.17.0-alpha.1 — 2026-07-04

### Added

- Voice Magic Frontier Runtime：剑击、生命/魔力/体力、等级成长与敌人仇恨AI。
- 无 LLM 的确定性声控咏唱语法与六种可组合战斗法术。
- 灰烬边境开放区域、第一句咏唱、材料收集、魔导器制造、遗迹解封和三阶段首领战。
- 风格化像素资产图集、单文件浏览器客户端、键鼠/触控/语音/文字多输入。
- 版本地图门：Season 0 完成后只登记“浮空学院”，不伪造未完成地图。

### Verified

- Runtime 专项 13/13；v0.17 纵向集成 2/2；完整玩法链可由确定性演示重放。

### Boundary

- 本版是共享世界 RPG 垂直切片，不宣称千人 MMO、商业 3D 角色质量或线上服务器已经完成。

## 0.15.0-alpha.1 — 2026-07-04

### Added

- RAGF v0.5无LLM社会生态生成、连续历史与玩家分支。
- 技术概念组合语法与七阶段工程落地路径。
- 2.5D投影、运行时契约和离线原型。
- Reality One Gateway社会生成与沙盒会话动作。

### Verified

- RAGF 170/170、Gateway 14/14、根集成25/25、专项集成6/6、15/15运行时健康。

### Boundary

- 本版是游戏生产种子与确定性模拟内核，不宣称已完成正式2.5D游戏。

# CHANGELOG

## 0.13.0-alpha.1 — 2026-07-04

### Added

- TaoWind Reality MCP `0.2.0-alpha.1` 创始人权威模式，默认主体 `subject:duhengjie`。
- AAF 候选授权/拒绝、行为注册/启停/热更新、正式合并、Loopback、Generation 回滚/重放。
- `rncs_authoritative_workflow` 正式闭环与 `rncs_runtime_action` Manifest 声明动作入口。
- `read / candidate / founder` 三档动态工具目录，总工具数最高 27。
- State Root＋Revision 乐观并发前置条件和破坏性工具标注。

### Fixed

- `rncs_list_runtimes`、`rncs_history`、`rncs_invocation_receipts` 顶层数组导致 MCP structuredContent 字典校验失败。
- 普通工具统一返回 `{ok, result}` 对象封装，数组和标量自动对象化。

### Preserved

- 14 个 RNCS/Aetherworld 原生运行时与既有权威语义不重写。
- 任意 Shell、任意文件读取和未声明运行时动作继续隔离。
- 没有底层发布动作时不伪造发布能力。

## 0.10.0-alpha.1 — 2026-07-03

### Added

- RAGF v0.4资产生产会话、三候选、十类生产就绪门、定点再生、选择与接受回执。
- Reality Studio v1.5 Asset Forge原生API、CLI、浏览器与离线工作台。
- 资产接受后自动建立场景节点、RSR身体和角色绑定。
- Gateway RAGF生产生命周期动作。
- Asset Production & Studio Forge纵向验收世界、PNG和结构化证据。

### Fixed

- Studio连续性导入从仅支持RAGF v0.1修复为兼容v0.1/v0.2/v0.3。
- Gateway桥接净化未定义字段，避免确定性序列化拒绝完整资产包。
- Studio健康端点和模块注册同步RAGF v0.4、RSR v0.9、VSR v0.8。

### Preserved

- RSR v0.9、VSR v0.8和Network v0.2协议不做无意义重写。
- 资产生产根、项目根、权威状态根、Frame Root和Pixel Root继续分离。


## 0.9.0-alpha.1 — 2026-07-03

### Added

- RSR v0.9精确Capsule–OBB、摩擦Warm Start、确定性约束岛、岛级休眠、Coyote Time和Jump Buffer。
- VSR v0.8五类glTF PBR纹理通道、双线性采样、切线空间Normal Map和Alpha Mask。
- Stable Embodiment & Complete PBR双客户端纵向验收世界、PNG与结构化证据。

### Fixed

- 摩擦缓存按Coulomb上限封顶，避免切向Warm Start超过当前法向支撑。
- Alpha Mask在深度写入前裁剪，避免透明像素错误遮挡后方几何。
- RSR/VSR README、STATUS和模块注册版本事实同步。

### Preserved

- Network v0.2继续复用RSR权威状态协议，没有建立第二套物理状态模型。
- Authority Root与Presentation Root持续分离。

## 0.8.0-alpha.1 — 2026-07-03

### Added

- RSR v0.8确定性空间分区、持久接触Warm Start、台阶、Ground Snap、移动平台和单向平台。
- VSR v0.7 glTF 2.0几何/材质/层级/动画导入、纹理采样和独立表现根。
- Playable Spatial World双客户端以太岛演示、PNG和结构化证据。

### Fixed

- 拆分位置纠正与速度迭代，避免重复位置纠正引起的过度分离。
- v0.5空间配置可迁移到v0.6快照。

### Preserved

- Network v0.2、RSR权威状态v0.7和VSR时间投影v0.6协议保持兼容。

## 0.7.0-alpha.1 — 2026-07-03

### Added

- Aetherworld RNCS Native Runtime Bridge `0.2.0-alpha.1`。
- Executable Compilation Plan v0.2 JSON Schema、校验和 v0.1 迁移。
- Reality Branch 候选现实：创建、Diff、模拟、批准、拒绝、合并与恢复。
- AAF 动作级 `allow / deny / require_approval` 裁决结果。
- 正式 Reality Behavior 注册、启停、热更新和区域触发样例。
- Behavior 执行结果、RSR 权威根、Network 收敛和 VSR 投影根进入 RFE 新 Generation 证据链。
- Gateway `rncs.aetherworld-native` Provider 与运行时发现。
- Aetherworld RNCS 世界驾驶舱。
- 双客户端 Loopback 以太岛端到端演示、一键脚本和测试证据。

### Changed

- 母工程版本升级为 `0.7.0-alpha.1`。
- Gateway 运行时数量由 13 增至 14。
- Aetherworld 版本升级为 `0.2.0-alpha.1`。
- 统一集成测试增加原生运行时发现与完整世界制造闭环。

### Preserved

- RSR `0.7.0-alpha.1`、VSR `0.6.0-alpha.1`、Network `0.2.0-alpha.1` 的既有权威、增量、历史、预测重放和时间投影协议未被重写或降级。

### Fixed

- 发布与测试脚本改用 `fileURLToPath`，完整ZIP在中文目录名下可直接解压、发现模块并运行测试。

## 0.12.0-alpha.1 — TaoWind Reality MCP

- 新增 `@taowind/taowind-reality-mcp` 远程 Streamable HTTP MCP 服务。
- 通过 Reality One Gateway 暴露 14 个 RNCS/Aetherworld 运行时的发现与健康状态。
- 新增 OpenAI 兼容 `search` / `fetch` 权威资料工具。
- 新增中文/CSL/IAL 编译、候选分支、差异与隔离模拟工具。
- 服务器侧硬性禁止 AAF 授权、候选合并、RFE 回滚、任意 Shell 与任意文件读取。
- 新增 Origin 校验、Host 限制、速率限制、会话清理、路径令牌与可选 Bearer 模式。
- 新增 Render/Railway/Docker 部署入口与 ChatGPT Developer Mode 接入文档。

## 0.16.0-alpha.1 - Town Life & Industry Vertical Slice

- Added a direct-open 2.5D isometric pixel town game with character creation and mobile controls.
- Added deterministic no-LLM food, work, school, career, material, manufacturing, technology and commerce loops.
- Added the porous ceramic → purifier → shop sale → town water-quality historical impact vertical slice.
- Added `@taowind/town-life-industry-runtime`, tests, evidence and release documentation.

## 0.18.0-alpha.1 — Third Person Open World

- Added a real WebGL third-person 3D client with perspective camera orbit and visible player avatar.
- Added open-world action combat: sword attack, dodge, target lock, enemy aggro and three-phase boss.
- Added deterministic voice-magic grammar and browser speech-recognition adapter with text fallback.
- Added sixteen simulated MMORPG player NPCs and local persistent world state.
- Added a Godot 4.7 native client source project with procedural world, player controller, combat, NPC players, HUD and Web speech bridge.
- Added browser behavior smoke tests, render capture and v0.18 mother-project integration tests.


## 0.19.4-alpha.1

- Integrated RCL v0.10 Stage-4 module and cross-file semantic core.
- Added qualified module symbols and imported contract type checking.
- Added `demo:rcl:bootstrap4`.
- Added first RFE/AAF semantic double-write seed.
