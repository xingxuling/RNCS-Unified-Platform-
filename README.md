# RNCS + Aetherworld Unified v0.19.8-alpha.1

本版本交付 **Aether Earth v0.1**：把 RCL/RNCS 的世界、100 个少数据生物、RCLpedia、时间加速、现实压缩、科学证据与集体智能结晶化组合为一个可运行产品。

## 本版核心结果

- 16×16 / 256 瓦片人工地球；
- 100 个持续主体与 4 种原型；
- 512 条初始 RCLpedia，运行验收后 524 条；
- 1×/10×/100× 逻辑时间；
- 720 天生成并原生验证 16 个 RCL/RBC 策略结晶；
- 世界状态 322,131 bytes → 27,325 bytes，无损恢复；
- 1000 天 / 100,000 agent-days：约 837 ms（当前容器）；
- 浏览器直接打开版与 Android Studio 源码宿主；
- RNCS Gateway/Registry 接入，Runtime health healthy（17 runtimes，含正式 `rncs.rcl-control`）；
- RCL `0.94.0-alpha.1` 已作为 workspace 真实语言运行时同步进 RNCS；
- `rncs.rcl-control` 可经 Gateway 完成 RCL → RBC → native VM → parity → RNCS candidate → RSR simulation → AAF → RFE commit；
- MCP 暴露只读 `rncs_rcl_compile_execute`、`rncs_rcl_compile_authority_plan`，以及 founder 权限的 `rncs_rcl_authority_workflow` 和 `rncs_execute_behavior`；后者只接受带状态前置条件、显式审批角色和 parity 证据的权威提交；
- RFE 提交回执会携带 RCL 原生 bytecode、authority plan 与 parity 证据根，RCL 不再只是 RNCS 的描述性输入。

## 运行

```bash
npm run test:aether-earth
npm run demo:aether-earth
npm run benchmark:aether-earth -- 1000
npm run verify:aether-earth
npm run health
```

直接打开：`Aether_Earth_v0.1_直接打开.html`。

Android 工程：`apps/aether-earth-android`。当前交付环境没有 Android SDK/Gradle，因此只交付已静态验证源码，不伪造 APK。

---

# RNCS + Aetherworld Unified v0.19.6-alpha.1

本版本集成 RCL v0.12 嵌入式长驻 VM 与 Provider ABI v1，并把 RNCS RCL 控制平面从 7 个模块扩展到 11 个模块。单份 AOT Bundle 可通过 daemon 或 `librclvm` 在同一进程中热执行。

## 本版核心结果

- RCL：70/70 PASS
- RCL Control Plane：7/7 PASS
- RNCS integration：34/34 PASS
- 11 个 RCL 化控制模块、10 条验证依赖边
- `librclvm.a`、`librclvm.so`、`rclvmd` 与 Provider ABI v1
- 直接嵌入 AOT Bundle：约 0.0036 ms/次（当前环境）
- 长驻 daemon：约 0.59 ms/次（含 IPC/JSON）
- Runtime health：healthy

## 验证入口

```bash
npm run test:rcl
npm run test:rcl-control-plane
npm run test:integration
npm run demo:rcl:embedded
npm run benchmark:rcl-control-plane
npm run modules
npm run health
```

## 性能边界

直接嵌入式基准证明 VM 本体已跨过进程启动瓶颈，但这不等同于整套 RNCS 自动获得同倍率提升。真实产品仍需把 Gateway/Runtime 嵌入长驻 VM、消除 JSON/IPC、建立增量状态与 Provider 调度后，才能把该优势传递到端到端任务。

---

# RNCS + Aetherworld Unified v0.19.5-alpha.1

本版本完成 RCL v0.11 Stage-5 自托管 RBC 编码器核心，并建立第一批 RNCS RCL 化控制平面：Core、RFE、AAF、Reality Branch、Reality Behavior、ICAR 与 CNP。旧实现继续承担生产功能，RCL 实现作为可执行语义镜像、跨模块契约与 parity 层。

## 验证入口

```bash
npm run test:rcl
npm run test:rcl-control-plane
npm run test:integration
npm run demo:rcl:bootstrap5
npm run demo:rcl-control-plane
npm run benchmark:rcl-control-plane
npm run modules
npm run health
```

## 实测结果

- RCL：66/66 PASS
- RCL Control Plane：6/6 PASS
- RNCS integration：34/34 PASS
- Runtime health：healthy
- AOT 单 RBC 控制平面回放：约 27.5ms（当前环境）

## 性能边界

RCL 化当前没有自动快过极小的 JSON/manifest 读取。冷编译和子进程启动仍然较慢；真正的运行性能优势需要嵌入式长驻 VM、AOT bundle、模块缓存和增量验证。当前最明确的收益是语义统一、跨模块编译检查和减少后续胶水代码。

---

# RNCS + Aetherworld Unified v0.19.1-alpha.1

本版本集成 **RCL v0.7 Native VM Bootstrap**：十四域现实地基保持完整，新增确定性 RBC 字节码、C 原生 VM、参考运行时一致性验证，以及 RCL 编写的 Stage-1 自托管编译器种子。

## 验证入口

```bash
npm run test:rcl
npm run demo:rcl:native
npm run demo:rcl:bytecode
npm run demo:rcl:bootstrap
```

## 边界

原生 VM v0.1 当前执行核心状态/事务/权界/证据子集；十四域专业 Provider、完整 parser/type checker/RBC encoder 自托管、JIT/AOT 尚未完成。

---

# RNCS + Aetherworld Unified v0.19.0-alpha.1

本版本集成 RCL v0.6 Foundation Closure：十四个基础现实域、五个认知运行平面、三个元现实运行平面，以及权界和因果证据横轴。新增能量、元素、科学、身体和精神现实。

## 验证

- RCL 40/40 tests passed
- 31 local workspace links
- Runtime health: healthy

## 关键边界

“地基收口”表示第一阶段统一现实语言结构成立，不代表意识、物理学、化学、生物学和科学发现问题已经彻底求解。

---

# RNCS＋Aetherworld Unified v0.18.9-alpha.1

本版本集成 **RCL v0.5 Meta Reality Foundation**，在九域现实、自然语言、理解、创造、内在与执行现实之上增加三条元现实运行平面：

1. **元时间空间现实**：参考系、离散时钟、时空坐标、同步与因果顺序；
2. **元加速现实**：在 fidelity、budget 与证据约束下改变计算执行策略；
3. **元压缩现实**：通过 reality root 约束可逆状态压缩与恢复。

## 本版新增

- `spacetime / frame / clock / coordinate / relation / synchronize`
- `acceleration / strategy memoize / factor / budget / fidelity / accelerate`
- `compression / lossless / deflate / reversible / discard / compress / restore`
- `SpacetimePoint` 与 `point / distance / same_frame / time_of`
- 所有后续变化自动携带时空戳
- 精确递归计算记忆化
- 状态命名空间可逆压缩胶囊

## 验证结果

```text
RCL tests:      33 / 33 passed
Runtime health: healthy
RCL version:    0.5.0-alpha.1
Suite version:  0.18.9-alpha.1
```

综合示例：

```text
clock = 6s
fib(24) = 46368
evaluations = 25
cache hits = 23
state bytes = 5221 → 69
restore root = verified
```

## 运行

```bash
npm run test:rcl
npm run demo:rcl:meta
npm run modules
npm run health
```

详细规格：`docs/architecture/RCL_META_REALITY_PLANES_SPEC_v0.5.md`

## v0.19.2：RCL Stage-2 自托管核心

RCL v0.8 已能在 C 原生 VM 内使用 RCL 编写的 tokenizer 与核心 parser，将源文本变成带 Span 的 Token 和 typed AST。Stage-0 JavaScript 仍只负责引导编译与 RBC 容器序列化，因此当前是 Stage-2 核心，不是完整自托管。


## v0.19.3-alpha.1：RCL Stage-3 语义自托管核心

RCL v0.9 已能在原生 VM 内完成核心名称解析、类型检查与 AST→typed IR，并提供 RNCS 语义层分阶段重写路线。完整母工程尚未被 RCL 一次性替换；高性能与平台能力继续作为 Provider。


## v0.19.4-alpha.1：RCL Stage-4 模块与跨文件语义核心

RCL v0.10 已能在原生 VM 中解析双模块 `module/import/require`，建立限定符号并验证跨文件依赖与类型。母工程同时加入 RFE→AAF 控制平面双写种子。完整自托管 RBC 编码、任意模块图和 Provider ABI 尚未完成。
