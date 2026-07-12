

## CSL v0.9 版本化升级 — 实施计划

### 一、目标对齐

**不是**：在 v0.8 parser 上硬堆功能 / 一次性重开所有未来语法 / 重写项目  
**是**：搭建版本化编译骨架 + 重开 0.2/0.3 第一批语法 + 预留 OSE Hook，且 v0.8 链路零破坏

### 二、架构设计

#### 1. 目录重组（新增，不动 v0.8 主链）

```
src/csl/
  ├─ lexer.ts                    [v0.8 保留，仅扩 KEYWORD 白名单]
  ├─ parser.ts                   [v0.8 保留，作为 base parser]
  ├─ ir-builder.ts               [v0.8 保留]
  ├─ runtime.ts                  [v0.8 保留]
  ├─ index.ts                    [改造为 dispatch 入口]
  │
  ├─ versions/                   [新增：版本注册中心]
  │    ├─ registry.ts            [GrammarVersion / FeatureFlag 定义]
  │    └─ dispatch.ts            [按版本路由到对应 parser/runtime]
  │
  ├─ v09/                        [新增：v0.9 扩展层]
  │    ├─ lexer-ext.ts           [v0.9 额外 KEYWORD：函数/如果/则/否则/调用/模板/展开/主体/主权阶段/阶段转移/编译层/再生事件/信号]
  │    ├─ parser-ext.ts          [v0.9 扩展 parser，import base parser 后挂分支]
  │    ├─ ast-nodes.ts           [v0.9 新 AST 节点类型定义]
  │    ├─ ir-ext.ts              [v0.9 IR 扩展构建]
  │    └─ runtime-ext.ts         [函数调用 / 阶段推进的最小 runtime]
  │
  ├─ ose/                        [新增：OSE 接口预留]
  │    └─ hooks.ts               [5 个空实现 Hook + 类型定义]
  │
  └─ examples/                   [重组：示例分层]
       ├─ stable-v08.ts          [当前 v0.8 默认示例]
       ├─ v09-functions.ts       [新增：函数+条件+模板示例]
       └─ v09-stages.ts          [新增：主体+阶段+编译层+信号示例]
```

#### 2. 版本注册中心 (`versions/registry.ts`)

```ts
export type GrammarVersion = 'v0.8' | 'v0.9' | 'experimental';

export type FeatureFlag =
  | 'functions' | 'conditionals' | 'call' | 'templates' | 'expand'
  | 'subjects' | 'sovereignty_stages' | 'stage_transitions'
  | 'compiler_layers' | 'regeneration_events' | 'signals'
  // 预留（本轮不开）
  | 'mapping_tables' | 'sealing' | 'colocation_chains' | 'domain_expansion'
  | 'units' | 'establishment' | 'tradeoffs' | 'engines' | 'modules'
  | 'concept_blocks' | 'proposition_blocks' | 'relation_blocks';

export const VERSION_FEATURES: Record<GrammarVersion, FeatureFlag[]> = {
  'v0.8': [],
  'v0.9': [
    'functions', 'conditionals', 'call', 'templates', 'expand',
    'subjects', 'sovereignty_stages', 'stage_transitions',
    'compiler_layers', 'regeneration_events', 'signals',
  ],
  'experimental': [/* 全部 */],
};
```

#### 3. Dispatch 机制 (`versions/dispatch.ts`)

`runCSL(input, version)` 按版本：
- v0.8 → 走当前纯净链路（lexer + parser + ir-builder + runtime），完全不变
- v0.9 → lexer 合并 v0.8 + v09 KEYWORDS；parser 用 v09/parser-ext（继承 base，识别新顶层关键字时走扩展分支，否则委托 base）；IR 合并；runtime 跑 base + 函数执行 + 阶段推进
- experimental → 暂时等同 v0.9

#### 4. v0.9 新 AST 节点类型

```
FunctionDecl       (函数 名 (参数) { 体 })
IfStmt             (如果 条件 则 ... 否则如果 ... 否则 ...)
ReturnStmt         (返回 表达式)
CallExpr           (调用 函数名(参数))
TemplateDecl       (模板 名<参数> { 体 })
ExpandDecl         (展开 模板名<实参> as 别名)
SubjectDecl        (主体 名 { 当前阶段=..., 字段=... })
SovStageDecl       (主权阶段 名 { 序号, 关键词, 描述 })
StageTransition    (阶段转移 名 { 从 X 到 Y 触发 条件 })
CompilerLayerDecl  (编译层 名 { 层级, 输入, 输出 })
RegenEventDecl     (再生事件 名 { 主体, 失配, 诊断, 重组, 新版本 })
SignalDecl         (信号 名 { 类型, 强度, 描述 })
```

#### 5. OSE Hook 预留 (`ose/hooks.ts`)

```ts
export interface OSEContext { ir, version, features }
export const oseHooks = {
  checkProblemDefinition: (ctx) => ({ passed: true, warnings: [] }),
  checkStructuralConsistency: (ctx) => ({ passed: true, warnings: [] }),
  raiseRiskWarnings: (ctx) => [],
  surfaceAssumptions: (ctx) => [],
  governOutput: (result, ctx) => result,
};
```
本轮全部 no-op，仅保留调用点和类型，未来不重写架构即可填实现。

#### 6. UI 版本切换 (`CSLPlayground.tsx`)

- 顶部加 Segmented Control：`v0.8 纯净` / `v0.9 扩展`（`experimental` 暂不开放）
- 示例下拉按当前版本过滤可用项；当前版本不支持的示例灰显并标注"需要 v0.9"
- 编辑器旁信息条：`当前版本：v0.9 · 已启用能力：函数 / 条件 / 主体 / 阶段 / 编译层 / 信号 / 再生事件`
- 版本切换时自动加载该版本默认示例

### 三、Phase 推进顺序（本轮一次性完成 P1+P2，P3 仅留接口）

| Phase | 内容 | 本轮范围 |
|---|---|---|
| P1 版本骨架 | registry + dispatch + UI 版本切换 + 示例分层 | ✅ 全做 |
| P2 v0.9 第一批语法 | 0.2 函数族 + 0.3 主体/阶段/编译层/信号/再生事件 | ✅ 全做（runtime 最小可运行） |
| P3 OSE 接口 | 5 个 Hook 类型 + 空实现 + dispatch 调用点 | ✅ 仅骨架 |
| P4（不做） | 映射表/封口/单元/引擎/概念块等 | ⛔ 留 feature flag 占位 |

### 四、最小可运行 v0.9 示例

**示例 A：函数+条件+模板**
```csl
// ===== v0.9：函数 + 条件 + 模板 =====

模板 可评估对象<T> {
  属性 名称: 文本
  属性 分数: 数值
}

展开 学生 = 可评估对象<人员>

实例 张三 属于 学生 {
  名称 = "张三"
  分数 = 85
}

函数 评级(分数) {
  如果 分数 >= 90 则 返回 "优秀"
  否则如果 分数 >= 60 则 返回 "合格"
  否则 返回 "不合格"
}

规则 自动评级 {
  条件 候选 ∈ 学生
  动作 调用 评级(候选.分数)
}
```

**示例 B：主体+阶段+编译层+信号+再生事件**
```csl
// ===== v0.9：主体 + 主权阶段 + 编译层 + 信号 + 再生事件 =====

主权阶段 借权 { 序号 = 2, 关键词 = (借壳, 依附), 描述 = "依附他人框架" }
主权阶段 摄权 { 序号 = 6, 关键词 = (收权, 中枢), 描述 = "形成自身秩序中心" }
主权阶段 回权 { 序号 = 9, 关键词 = (回收, 内核回归), 描述 = "拉回定义权" }

阶段转移 借到摄 { 从 借权 到 摄权 触发 边界感 > 50 }

主体 创业者A {
  当前阶段 = 借权
  边界感 = 75
}

编译层 浮现层 {
  层级 = "B"
  输入 = (高密度结构云)
  输出 = (关键词闪现, 命名欲)
}

信号 命名冲动 { 类型 = "概念冲动", 强度 = 90, 描述 = "强烈想给某物起新名字" }

再生事件 Agent升级 {
  主体 = "创业者A"
  失配 = "旧策略在新环境失效"
  诊断 = "权限分配模型不匹配"
  重组 = "重写边界协议"
  新版本 = "v2.0"
}
```

### 五、文件级变更清单

**新增（11 个）**
- `src/csl/versions/registry.ts`
- `src/csl/versions/dispatch.ts`
- `src/csl/v09/lexer-ext.ts`
- `src/csl/v09/parser-ext.ts`
- `src/csl/v09/ast-nodes.ts`
- `src/csl/v09/ir-ext.ts`
- `src/csl/v09/runtime-ext.ts`
- `src/csl/ose/hooks.ts`
- `src/csl/examples/stable-v08.ts`（从 default-example 迁移）
- `src/csl/examples/v09-functions.ts`
- `src/csl/examples/v09-stages.ts`

**修改（4 个）**
- `src/csl/index.ts`：runCSL 增加 version 参数，委托 dispatch
- `src/csl/examples.ts`：每个示例加 `version` + `requiredFeatures` 字段，按版本分组
- `src/pages/CSLPlayground.tsx`：版本切换 UI、按版本过滤示例、传 version 给 runCSL
- `src/csl/types.ts`：CSLResult 加 `version` 字段

**不动**
- `src/csl/lexer.ts`、`src/csl/parser.ts`、`src/csl/ir-builder.ts`、`src/csl/runtime.ts`（v0.8 主链零修改）
- `src/csl/default-example.ts`（保留，作为 stable-v08 的备份引用）
- 所有现有 0.3+ Panel 组件（继续展示，v0.9 IR 喂数据）

### 六、v0.8 不被破坏的保证

1. 当用户选 v0.8 时，dispatch 直接调用现有 `lexer.tokenize` + `Parser.parse` + `buildIR` + `runtime.*`，**与升级前 100% 等价**
2. v0.8 的 KEYWORD 白名单（20 词）不动；v0.9 KEYWORDS 在 `v09/lexer-ext.ts` 单独维护，仅在 v0.9 模式合并
3. v0.8 默认示例 `stable-v08.ts` 内容来自现有 `default-example.ts`，逐字节相同
4. v0.8 模式下，源码区只接受 v0.8 KEYWORD，输入 `函数` 仍被识别为 IDENTIFIER（与当前行为一致）
5. 切换到 v0.9 不影响 v0.8 模式回切：版本是纯前端 state，无副作用

### 七、本轮真开 / 仅占位

**真开（lexer + parser + IR + runtime 至少最小执行）**
- functions、conditionals、call、templates、expand
- subjects、sovereignty_stages、stage_transitions
- compiler_layers、regeneration_events、signals

**仅占位（feature flag 注册但 parser 不识别）**
- mapping_tables、sealing、colocation_chains、domain_expansion
- units、establishment、tradeoffs、engines、modules
- concept_blocks、proposition_blocks、relation_blocks
- AIE / 文明母体深层 runtime / 自举系统

**Hook 占位（架构留点）**
- OSE 5 Hook 全部 no-op，dispatch 后调用一次但不影响输出

### 八、验收标准

1. **v0.8 回归**：切到 v0.8，默认示例 Tokens/AST/IR 与升级前完全一致
2. **v0.9 示例 A**：解析无错，AST 含 FunctionDecl/IfStmt/TemplateDecl/ExpandDecl/CallExpr，runtime 输出"张三 → 合格"
3. **v0.9 示例 B**：解析无错，AST 含 SubjectDecl/SovStageDecl/StageTransition/CompilerLayerDecl/SignalDecl/RegenEventDecl，主体面板显示阶段推进结果
4. **版本隔离**：v0.8 模式下加载 v0.9 示例 → UI 灰显并提示"需切换 v0.9"
5. **源码纯净**：两个 v0.9 示例首屏不出现任何 HTML 标签
6. **OSE Hook**：dispatch 中能 console.log 看到 5 个 Hook 被调用一次（但不报错、不改变输出）

### 九、范围控制（不做）

- 不动现有 9 个 Panel 组件结构
- 不重构 lexer / parser 主文件
- 不引入新 npm 依赖
- 不实现 OSE 任何具体规则
- 不实现 0.4+ 任何语法
- 不动 federation.ts / csl-upgrade-generator.ts / concept-ai-v2.ts 等高层模块

