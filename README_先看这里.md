# RNCS + Aetherworld Unified v0.19.7-alpha.1 — Aether Earth

本版第一次把 RCL/RNCS 的世界、100 个少数据生物、RCLpedia、时空加速、现实压缩与集体智能结晶化组合成可运行产品。

## 先体验

直接打开根目录：

```text
Aether_Earth_v0.1_直接打开.html
```

完整验证：

```bash
npm run bootstrap:workspaces
npm run test:aether-earth
npm run demo:aether-earth
npm run verify:aether-earth
npm run test:rcl-control-plane
npm run test:integration
npm run health
```

## 验收摘要

- 256 瓦片、100 个生物、512+ RCLpedia；
- 720 天生成 16 个经原生 VM 验证的 RCL/RBC 结晶；
- 322,131 bytes → 27,325 bytes，无损恢复；
- 1000 天/100,000 agent-days：约 837 ms；
- Aether Earth 12/12、RCL 70/70、控制平面 7/7、集成 36/36；
- Runtime health：healthy（16 runtimes）。

## Android

源码工程：`apps/aether-earth-android`。已实现前台持续世界、JobScheduler 补算和 GZIP 状态胶囊。当前容器缺少 Android SDK/Gradle，因此没有伪造 APK。

---

# RNCS + Aetherworld Unified v0.19.6-alpha.1

本版完成 RCL `0.12.0-alpha.1` 嵌入式长驻 VM、Provider ABI v1，以及 11 模块 RNCS RCL AOT 控制平面。

## 先运行

```bash
npm run bootstrap:workspaces
npm run test:rcl
npm run test:rcl-control-plane
npm run test:integration
npm run benchmark:rcl-control-plane
npm run health
```

## 验收摘要

- RCL：70/70
- 控制平面：7/7
- RNCS integration：34/34
- Runtime health：healthy
- 直接嵌入 AOT：约 0.00372 ms/次（当前环境）

## 重要边界

当前已 RCL 化的是 11 个语义控制模块；RSR/VSR、网络、数据库、Android、Godot 和硬件驱动继续作为 Provider。远端 GitHub/Vercel 写入未执行。

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

## v0.19.2 新增

- RCL v0.8 Stage-2 自托管 tokenizer/parser；
- RBC 1.1 与 C VM v0.2；
- 原生 Sequence / Span / Token / AST / ParseState；
- 51 项 RCL 回归与自举测试。


## v0.19.3-alpha.1：RCL Stage-3 语义自托管核心

RCL v0.9 已能在原生 VM 内完成核心名称解析、类型检查与 AST→typed IR，并提供 RNCS 语义层分阶段重写路线。完整母工程尚未被 RCL 一次性替换；高性能与平台能力继续作为 Provider。
