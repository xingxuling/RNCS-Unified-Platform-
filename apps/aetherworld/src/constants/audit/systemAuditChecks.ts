export type AuditSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AuditStatus = "PASS" | "WARN" | "FAIL" | "PENDING";

export interface SystemAuditCheck {
  id: string;
  module: string;
  title: string;
  /** Statically known severity if the check fails. */
  severity: AuditSeverity;
  /** Plain-language description of what is checked. */
  description: string;
  /** How to fix if the check fails. */
  fixHint: string;
  /** Pre-built Lovable repair prompt when status = FAIL. */
  repairPrompt: string;
}

export const SYSTEM_AUDIT_CHECKS: SystemAuditCheck[] = [
  {
    id: "msl-route",
    module: "MSL",
    title: "MSL 有独立页面入口",
    severity: "HIGH",
    description: "/sequence-language /mother-sequence-language /msl-console 三档入口齐备。",
    fixHint: "新建 src/routes/sequence-language.tsx 等路由文件并在侧边栏注册。",
    repairPrompt: "请补全 MSL 三档入口路由：/sequence-language（新手）、/mother-sequence-language（高阶）、/msl-console（Founder），并在 AppSidebar 注册。",
  },
  {
    id: "msl-parse-single",
    module: "MSL",
    title: "能解析单条五位数",
    severity: "CRITICAL",
    description: "parseMSL('55555') 必须返回 valid=true 且包含一条 statement。",
    fixHint: "检查 src/lib/msl/mslParser.ts 中的 RE_PLAIN5 与 makeStatement。",
    repairPrompt: "请修复 src/lib/msl/mslParser.ts：parseMSL('55555') 应返回 valid=true，且 statements 长度为 1，五位 digits 正确切分。",
  },
  {
    id: "msl-parse-full60",
    module: "MSL",
    title: "能解析 Full 60",
    severity: "HIGH",
    description: "解析 60 条带编号语句，isFull60 标记为 true。",
    fixHint: "确认 parseMSL 的 isFull60 判定逻辑覆盖 index === 60 与 ≥60 总数。",
    repairPrompt: "请修复 src/lib/msl/mslParser.ts 的 isFull60 判定，使输入 1..60 数列时返回 true。",
  },
  {
    id: "msl-privacy",
    module: "MSL",
    title: "Full 60 有隐私提示",
    severity: "HIGH",
    description: "isFull60=true 时 safetyNotesFor 必须返回包含 ‘Full 60’ 关键字的提示。",
    fixHint: "src/lib/msl/mslSafetyGuard.ts → safetyNotesFor。",
    repairPrompt: "请在 src/lib/msl/mslSafetyGuard.ts 的 safetyNotesFor 中添加 Full 60 隐私提示。",
  },
  {
    id: "msl-compile-world",
    module: "MSL",
    title: "能编译到 Sequence World Engine",
    severity: "HIGH",
    description: "compileStatement(stmt, 'WORLD_ENGINE') 输出 kind=WorldEngineProfile。",
    fixHint: "src/lib/msl/mslCompiler.ts → case 'WORLD_ENGINE'。",
    repairPrompt: "请确保 src/lib/msl/mslCompiler.ts 的 WORLD_ENGINE 分支输出 WorldEngineProfile，并包含 sequenceCore/worldState。",
  },
  {
    id: "msl-compile-ial",
    module: "MSL",
    title: "能编译到 IAL-like 结构描述",
    severity: "HIGH",
    description: "compileStatement(stmt, 'IAL') 输出 kind=STRUCTURE_STATE，含 allowed_actions。",
    fixHint: "src/lib/msl/mslCompiler.ts → case 'IAL'。",
    repairPrompt: "请确保 MSL 能编译为 IAL 结构描述（kind=STRUCTURE_STATE，含 allowed_actions/forbidden_actions）。",
  },
  {
    id: "msl-export-godot",
    module: "MSL",
    title: "能导出 Godot JSON",
    severity: "MEDIUM",
    description: "mslToGodot 输出 json 数组与 GDScript 字符串。",
    fixHint: "src/lib/msl/mslToGodot.ts。",
    repairPrompt: "请在 src/lib/msl/mslToGodot.ts 输出 json 数组（snake_case）与 GDScript skeleton。",
  },
  {
    id: "msl-export-unity",
    module: "MSL",
    title: "能导出 Unity JSON",
    severity: "MEDIUM",
    description: "mslToUnity 输出 json 数组与 C# skeleton。",
    fixHint: "src/lib/msl/mslToUnity.ts。",
    repairPrompt: "请在 src/lib/msl/mslToUnity.ts 输出 json 数组（PascalCase）与 C# skeleton。",
  },
  {
    id: "omni-route-msl",
    module: "Omni",
    title: "Omni 能路由到 MSL",
    severity: "MEDIUM",
    description: "Omni 全域计算模型应能将含五位数列的查询分发到 MSL 控制台。",
    fixHint: "在 Omni 路由表中注册 MSL 入口。",
    repairPrompt: "请在 Omni 全域计算模型的路由器中新增 MSL（路径 /msl-console）作为目标模块，命中条件：输入命中五位数字模式或包含 ‘数列/五域/MSL’。",
  },
  {
    id: "omni-route-world",
    module: "Omni",
    title: "Omni 能路由到 Sequence World Engine",
    severity: "MEDIUM",
    description: "含 ‘世界/世界引擎/Render/NPC’ 关键词应路由到 /sequence-world。",
    fixHint: "在 Omni 路由表中注册 Sequence World Engine 入口。",
    repairPrompt: "请在 Omni 路由器中注册 Sequence World Engine 目标（/sequence-world），命中条件包含 ‘世界 / 渲染 / NPC / 任务’ 等关键词。",
  },
  {
    id: "sw-active-subject",
    module: "Sequence World Engine",
    title: "能读取 activeSubjectProfile",
    severity: "HIGH",
    description: "SequenceWorldPanel 应从 store 中读取 activeSubjectProfile 作为默认输入。",
    fixHint: "src/components/sequence-world/SequenceWorldPanel.tsx 中加入 getActiveSubjectProfile。",
    repairPrompt: "请让 SequenceWorldPanel 在挂载时调用 getActiveSubjectProfile()，若存在则作为默认数列输入。",
  },
  {
    id: "vlife-read-world",
    module: "Virtual Life",
    title: "能读取世界引擎结果",
    severity: "MEDIUM",
    description: "Virtual Life 生成今日剧本时应能接入 SequenceWorldEngine 的世界状态。",
    fixHint: "src/lib/virtualDayGenerator.ts 接入 SequenceWorldEngine 输出。",
    repairPrompt: "请让 virtualDayGenerator 在生成 VirtualDay 时读取最近一次 SequenceWorldEngine 的 worldState 作为环境上下文。",
  },
  {
    id: "encyclopedia-msl",
    module: "Product Encyclopedia",
    title: "百科有 MSL 条目",
    severity: "MEDIUM",
    description: "产品百科应包含 MSL / 母体数列语言 / Reseed Chain / Full 60 Protocol 等条目。",
    fixHint: "在 src/lib/encyclopediaEngine.ts 注册 MSL 条目。",
    repairPrompt: "请在产品百科（encyclopediaEngine）注册条目：Mother Sequence Language、MSL Parser、MSL Compiler、MSL Program Runner、Reseed Chain、Full 60 Protocol。",
  },
  {
    id: "usage-examples-msl",
    module: "Usage Examples",
    title: "Usage Examples 有 MSL 示例",
    severity: "MEDIUM",
    description: "示例库应包含至少 1 个 MSL 示例（建议：解释 55555、运行 RESEED_CHAIN）。",
    fixHint: "在 src/constants/exampleScenarioTypes.ts 增加 MSL 场景。",
    repairPrompt: "请在 Usage Example 库中新增 MSL 示例（例如 ‘解释 55555’、‘运行 PROGRAM RESEED_CHAIN’），并关联模块 /msl-console。",
  },
  {
    id: "promptforge-msl",
    module: "Prompt Forge",
    title: "Prompt Forge 能根据 MSL 生成提示词",
    severity: "MEDIUM",
    description: "mslToPromptForge 应可生成 lovable/codex/godot/unity 等多种 preset。",
    fixHint: "src/lib/msl/mslToPromptForge.ts。",
    repairPrompt: "请验证 mslToPromptForge 支持所有 8 个 preset，并在 Prompt Forge 页面新增 ‘从 MSL 生成’ 入口。",
  },
  {
    id: "qa-msl-checks",
    module: "Software QA",
    title: "QA 能检查 MSL 风险",
    severity: "HIGH",
    description: "Software QA 应能扫描 MSL 输入合法性、隐私提示、安全说明缺失等。",
    fixHint: "在 src/lib/softwareQa 类似位置注册 MSL 规则。",
    repairPrompt: "请在 Software QA 中注册 MSL 检查规则：5 位有效性、Full60 隐私提示、是否宣称改变现实、编译输出 trace/safetyNotes 是否存在。",
  },
  {
    id: "recalc-msl",
    module: "Recalculation",
    title: "Recalculation 能标记 MSL stale",
    severity: "MEDIUM",
    description: "opcode/domain/block 定义或 SequenceWorldEngine 变更时，应能标记 MSL stale。",
    fixHint: "在 src/lib/recalculation 注册 MSL stale 触发源。",
    repairPrompt: "请在 Recalculation 中注册 MSL stale 触发器：opcode、domain、block、Sequence World、Prompt Forge、Safety Rules 任一更新均触发 ‘Recalculate MSL’。",
  },
  {
    id: "founder-trace",
    module: "Founder Mode",
    title: "Founder 能看到完整 MSL trace",
    severity: "MEDIUM",
    description: "MSL Console 在 Founder 视图下显示 11 个完整编译目标与 Program Runner。",
    fixHint: "MSLConsole 已根据 effectiveMode 切换可见性，确认 founderActive 生效。",
    repairPrompt: "请验证 MSLConsole 在 founderActive=true 时显示全部 11 个编译目标与 Program Runner。",
  },
  {
    id: "beginner-only-interpreter",
    module: "Onboarding",
    title: "普通用户只看到「数列解释器」",
    severity: "LOW",
    description: "新手模式侧边栏只显示 /sequence-language，不显示 Console 与 Advanced。",
    fixHint: "AppSidebar 的 NAV_MSL_BEGINNER 仅包含 /sequence-language。",
    repairPrompt: "请确认 AppSidebar NAV_MSL_BEGINNER 只包含 /sequence-language 一项。",
  },
  {
    id: "no-reality-claim",
    module: "Safety Boundary",
    title: "避免宣称 MSL 能直接改变现实",
    severity: "CRITICAL",
    description: "checkMSLText 必须阻断 ‘运行数列即可改变现实/数列绝对决定现实’ 等表述。",
    fixHint: "src/constants/msl/mslSafetyRules.ts 与 src/lib/msl/mslSafetyGuard.ts。",
    repairPrompt: "请在 mslSafetyRules 中保持 no-direct-reality 规则为 CRITICAL，并确保 checkMSLText 能命中禁词。",
  },
];
