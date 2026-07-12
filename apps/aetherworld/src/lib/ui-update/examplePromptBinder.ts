// Example Prompt Binder — binds Usage Examples to modules
// v0.3：覆盖所有 CORE / IMPORTANT 模块 ≥ 3 个示例。
import { UI_MODULE_REGISTRY } from "./uiModuleRegistry";

export interface ExamplePromptBinding {
  moduleId: string;
  examples: { title: string; input: string }[];
}

const b = (moduleId: string, examples: { title: string; input: string }[]): ExamplePromptBinding => ({ moduleId, examples });

export const EXAMPLE_BINDINGS: ExamplePromptBinding[] = [
  // ---- PUBLIC CORE ----
  b("free-input", [
    { title: "项目决策", input: "我现在该不该推进这个项目？" },
    { title: "想法分析", input: "帮我分析这个想法，并给下一步。" },
    { title: "提示词改写", input: "把这个内容写成 Lovable 提示词。" },
  ]),
  b("sequence-ai", [
    { title: "数列解释", input: "解释 55555。" },
    { title: "今日生活", input: "生成今天的虚拟生活。" },
    { title: "系统体检", input: "检查系统缺什么。" },
  ]),
  b("subject-mode", [
    { title: "查看当前主体", input: "查看当前主体模式。" },
    { title: "切换 Demo", input: "切换到 Demo 主体。" },
    { title: "了解 Full60", input: "Full60 主体是什么？" },
  ]),
  b("real-subject-setup", [
    { title: "粘贴 Light20", input: "粘贴 20 组真实数列。" },
    { title: "升级 Full60", input: "把 Light20 升级为 Full60。" },
    { title: "导出主体", input: "导出当前真实主体。" },
  ]),
  b("usage-examples", [
    { title: "查世界示例", input: "显示世界引擎示例。" },
    { title: "查 MSL 示例", input: "显示 MSL 示例。" },
    { title: "查 AI 示例", input: "显示数列 AI 示例。" },
  ]),

  // ---- PUBLIC IMPORTANT ----
  b("model-generation", [
    { title: "角色模型", input: '给"蓝天机"生成角色模型' },
    { title: "世界模型", input: "生成蓝天机世界模型" },
    { title: "剧情模型", input: "生成剧情结构模型" },
  ]),
  b("narrative", [
    { title: "漫画脚本", input: "给蓝天机写漫画脚本。" },
    { title: "历史压缩", input: "把世界历史压缩成剧情圣经。" },
    { title: "NPC 独白", input: "写一个 NPC 独白。" },
  ]),
  b("vocal", [
    { title: "歌词→Suno", input: "把歌词生成 Suno prompt。" },
    { title: "角色声线", input: "给蓝天机生成角色声线。" },
    { title: "主题曲", input: "生成世界主题曲提示词。" },
  ]),
  b("translation", [
    { title: "中→英", input: "把『数列元智能驱动器』翻译成英文。" },
    { title: "中→日", input: "把『常数宇宙』翻译成日文。" },
    { title: "概念转译", input: "把『黑白箱压缩』转译成法文。" },
  ]),
  b("sequence-world", [
    { title: "生成世界", input: "用 55555 生成一个世界。" },
    { title: "运行 BLOCK", input: "运行 BLOCK 49..60。" },
    { title: "导出 Godot", input: "导出 Godot JSON。" },
  ]),
  b("world-knowledge", [
    { title: "查 MSL", input: "MSL 是什么？" },
    { title: "查常数宇宙", input: "常数宇宙包含哪些条目？" },
    { title: "查模块说明", input: "Sequence Terminal 是什么？" },
  ]),
  b("encyclopedia", [
    { title: "数列终端", input: "数列终端是什么？" },
    { title: "主体模式", input: "主体模式是什么？" },
    { title: "数列货币", input: "数列货币是什么？" },
  ]),
  b("sequence-currency", [
    { title: "今日记录", input: "我今天生成了什么资产？" },
    { title: "贡献排行", input: "查看本月贡献排行。" },
    { title: "了解规则", input: "数列货币的发放规则是什么？" },
  ]),
  b("learn", [
    { title: "新手教程", input: "我不会用，给我新手教程。" },
    { title: "FAQ", input: "查看常见问题。" },
    { title: "技术手册", input: "查看 Founder 技术手册。" },
  ]),

  // ---- ADVANCED ----
  b("msl", [
    { title: "解释 55555", input: "explain 55555" },
    { title: "BLOCK", input: "block 49..60" },
    { title: "运行 PROGRAM", input: "run RESEED_CHAIN" },
  ]),
  b("sequence-terminal", [
    { title: "运行世界模拟", input: "world.sim run 49..60" },
    { title: "运行 UI 审计", input: "ui.audit" },
    { title: "运行宪法检查", input: 'constitution.check "..."' },
  ]),
  b("world-simulation", [
    { title: "tick x10", input: "tick x10" },
    { title: "BLOCK 49..60", input: "run BLOCK 49..60" },
    { title: "导出快照", input: "export snapshot" },
  ]),
  b("world-growth", [
    { title: "生长一次", input: "让这个世界安全生长一次。" },
    { title: "突变分支", input: "为这个世界生成一次突变分支。" },
    { title: "正典回写", input: "把生长结果写入正典。" },
  ]),
  b("world-society", [
    { title: "三阵营", input: "让这个世界形成三个阵营。" },
    { title: "经济结构", input: "推演这个世界的经济结构。" },
    { title: "信仰演化", input: "推演这个世界的信仰演化。" },
  ]),
  b("civilization", [
    { title: "下一个时代", input: "让这个文明进入下一个时代。" },
    { title: "技术树", input: "生成这个文明的技术树。" },
    { title: "战争与和平", input: "推演两个文明的战争与和平。" },
  ]),
  b("world-presentation", [
    { title: "Godot 参数", input: "把 55555 变成 Godot 表现层参数。" },
    { title: "Unity 参数", input: "把 55555 变成 Unity 表现层参数。" },
    { title: "Three 参数", input: "把 55555 变成 Three.js 表现层参数。" },
  ]),
  b("constant-universe", [
    { title: "查数字 5", input: "查看数字 5 的全引擎常数。" },
    { title: "常数审计", input: "运行常数审计。" },
    { title: "导出 JSON", input: "导出常数宇宙 JSON。" },
  ]),
  b("system-constitution", [
    { title: "主体主权", input: "查看主体主权条款。" },
    { title: "宪法合规", input: "运行宪法合规检查。" },
    { title: "CRITICAL", input: "查看 CRITICAL 违规。" },
  ]),
  b("hybrid-compression", [
    { title: "压缩上一条", input: "把上一条结果压缩成普通用户版。" },
    { title: "查看黑箱信号", input: "查看上一条结果的黑箱信号。" },
    { title: "导出白箱", input: "导出本次输出的白箱细节。" },
  ]),
  b("prompt-forge", [
    { title: "锻造 Lovable", input: "为蓝天机锻造一条 Lovable 提示词。" },
    { title: "锻造 Suno", input: "为蓝天机锻造一条 Suno 提示词。" },
    { title: "锻造 Godot", input: "为蓝天机锻造一条 Godot 提示词。" },
  ]),
  b("software-qa", [
    { title: "全量 QA", input: "qa.run --all" },
    { title: "按模块筛选", input: "qa.run --module=ui-update" },
    { title: "导出报告", input: "qa.export" },
  ]),
  b("recalculation", [
    { title: "重算 stale", input: "recalc.stale" },
    { title: "重算全部", input: "recalc.all" },
    { title: "查上次重算", input: "recalc.last" },
  ]),
  b("ui-update", [
    { title: "UI 审计", input: "ui.audit" },
    { title: "重新生成 Quick Start", input: "ui.quickstart regenerate" },
    { title: "查修复提示词", input: "ui.fix prompt" },
  ]),
  b("interface-audit", [
    { title: "完整审计", input: "ui.audit --full" },
    { title: "按权限过滤", input: "ui.audit --userMode=PUBLIC" },
    { title: "导出 JSON", input: "ui.audit --export" },
  ]),
];

export function getExamples(moduleId: string) {
  return EXAMPLE_BINDINGS.find((b) => b.moduleId === moduleId)?.examples ?? [];
}

export function exampleCoverage() {
  const covered = new Set(EXAMPLE_BINDINGS.map((b) => b.moduleId));
  const eligible = UI_MODULE_REGISTRY.filter((m) => m.priority === "CORE" || m.priority === "IMPORTANT");
  const missing = eligible.filter((m) => !covered.has(m.moduleId)).map((m) => m.moduleId);
  return {
    total: eligible.length,
    covered: eligible.length - missing.length,
    missing,
    percent: eligible.length === 0 ? 100 : Math.round(((eligible.length - missing.length) / eligible.length) * 100),
  };
}
