import type { TerminalPermissionLevel } from "./terminalPermissionLevels";

export interface CommandDefinition {
  command: string;
  namespace?: string;
  description: string;
  examples: string[];
  requiredPermission: TerminalPermissionLevel;
  targetEngine: string;
  readOnly: boolean;
  safetyLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  flags?: { name: string; values?: string[]; description?: string }[];
}

export const TERMINAL_COMMANDS: CommandDefinition[] = [
  // 基础
  { command: "help",    description: "查看命令帮助。可附加：help msl / help export / help founder。", examples: ["help", "help msl", "help export"], requiredPermission: "PUBLIC_READ", targetEngine: "terminalHelp", readOnly: true, safetyLevel: "LOW" },
  { command: "clear",   description: "清空终端输出区。", examples: ["clear"], requiredPermission: "PUBLIC_READ", targetEngine: "terminalSession", readOnly: true, safetyLevel: "LOW" },
  { command: "history", description: "查看最近的命令历史。", examples: ["history"], requiredPermission: "PUBLIC_READ", targetEngine: "terminalHistory", readOnly: true, safetyLevel: "LOW" },
  { command: "status",  description: "查看当前终端 / 主体 / 权限状态。", examples: ["status"], requiredPermission: "PUBLIC_READ", targetEngine: "terminalSession", readOnly: true, safetyLevel: "LOW" },

  // 数列 / MSL
  { command: "parse",   description: "解析一条数列。", examples: ["parse 55555", "parse 34230"], requiredPermission: "PUBLIC_READ", targetEngine: "msl", readOnly: true, safetyLevel: "LOW" },
  { command: "explain", description: "解释一条数列的语义。", examples: ["explain 55555", "explain 00000"], requiredPermission: "PUBLIC_READ", targetEngine: "msl", readOnly: true, safetyLevel: "LOW" },
  { command: "block",   description: "查看 BLOCK 段落。", examples: ["block 49..60"], requiredPermission: "USER_LOCAL", targetEngine: "msl", readOnly: true, safetyLevel: "LOW" },
  { command: "run",     description: "运行 MSL PROGRAM。", examples: ["run RESEED_CHAIN", "run PROGRAM <name>"], requiredPermission: "ADVANCED", targetEngine: "msl", readOnly: false, safetyLevel: "MEDIUM" },
  { command: "compile", description: "把数列编译到目标层。", examples: ["compile 55555 --to world", "compile 55555 --to godot", "compile 55555 --to unity", "compile 34230 --to ial"], requiredPermission: "ADVANCED", targetEngine: "msl", readOnly: false, safetyLevel: "MEDIUM", flags: [{ name: "to", values: ["world", "ial", "render", "godot", "unity", "json", "prompt"] }] },

  // Sequence AI / Free Input
  { command: "ask", description: "自然语言问 Sequence AI。", examples: ['ask "我现在该不该推进这个项目？"'], requiredPermission: "PUBLIC_READ", targetEngine: "sequenceAI", readOnly: true, safetyLevel: "LOW" },

  // 引擎
  { command: "model.generate",     namespace: "model",     description: "生成结构化模型。", examples: ['model.generate "给蓝天机生成角色模型"'], requiredPermission: "ADVANCED", targetEngine: "modelGeneration", readOnly: false, safetyLevel: "MEDIUM" },
  { command: "world.generate",     namespace: "world",     description: "从数列生成世界。", examples: ["world.generate --from 55555"], requiredPermission: "ADVANCED", targetEngine: "sequenceWorld", readOnly: false, safetyLevel: "MEDIUM" },
  { command: "world.export",       namespace: "world",     description: "导出世界到引擎格式。", examples: ["world.export --target godot", "world.export --target unity"], requiredPermission: "ADVANCED", targetEngine: "sequenceWorld", readOnly: false, safetyLevel: "MEDIUM" },
  { command: "narrative.generate", namespace: "narrative", description: "生成剧情 / 漫画脚本。", examples: ['narrative.generate "给蓝天机写一段漫画脚本"'], requiredPermission: "ADVANCED", targetEngine: "narrative", readOnly: false, safetyLevel: "MEDIUM" },
  { command: "vocal.prompt",       namespace: "vocal",     description: "生成 Suno / Udio 提示词。", examples: ['vocal.prompt "把这段歌词生成 Suno prompt"'], requiredPermission: "ADVANCED", targetEngine: "vocal", readOnly: false, safetyLevel: "MEDIUM" },
  { command: "translate",          description: "翻译概念到目标语言。", examples: ['translate "万物本身计算法" --to en'], requiredPermission: "USER_LOCAL", targetEngine: "translation", readOnly: false, safetyLevel: "LOW", flags: [{ name: "to", values: ["en", "zh", "zh-tw", "ja", "ko", "fr"] }] },

  // QA / Recalc
  { command: "qa.run",     namespace: "qa",     description: "运行软件质量检查。", examples: ["qa.run", "qa.run --module msl", "qa.run --critical-only"], requiredPermission: "USER_LOCAL", targetEngine: "softwareQA", readOnly: true, safetyLevel: "LOW" },
  { command: "recalc.all", namespace: "recalc", description: "运行总重算。", examples: ["recalc.all", "recalc msl", "recalc knowledge"], requiredPermission: "USER_LOCAL", targetEngine: "recalculation", readOnly: false, safetyLevel: "MEDIUM" },

  // 系统宪法
  { command: "constitution.summary",   namespace: "constitution", description: "查看系统宪法摘要：版本、条款数、Founder Locked、CRITICAL 数。", examples: ["constitution.summary"], requiredPermission: "PUBLIC_READ", targetEngine: "systemConstitution", readOnly: true, safetyLevel: "LOW" },
  { command: "constitution.list",      namespace: "constitution", description: "列出宪法条款（可按类别筛选）。", examples: ["constitution.list", "constitution.list --category SUBJECT_SOVEREIGNTY"], requiredPermission: "PUBLIC_READ", targetEngine: "systemConstitution", readOnly: true, safetyLevel: "LOW" },
  { command: "constitution.show",      namespace: "constitution", description: "查看单条宪法条款详情。", examples: ["constitution.show A010", "constitution.show A070"], requiredPermission: "PUBLIC_READ", targetEngine: "systemConstitution", readOnly: true, safetyLevel: "LOW" },
  { command: "constitution.check",     namespace: "constitution", description: "对一段输出做宪法合规检查。", examples: ['constitution.check "数列货币可以提现"', 'constitution.check --engine SequenceAI "这是现实事实"'], requiredPermission: "USER_LOCAL", targetEngine: "systemConstitution", readOnly: true, safetyLevel: "MEDIUM" },
  { command: "constitution.violations", namespace: "constitution", description: "列出宪法违规类型登记。", examples: ["constitution.violations"], requiredPermission: "PUBLIC_READ", targetEngine: "systemConstitution", readOnly: true, safetyLevel: "LOW" },
  { command: "constitution.version",   namespace: "constitution", description: "查看宪法当前版本与历史版本。", examples: ["constitution.version"], requiredPermission: "PUBLIC_READ", targetEngine: "systemConstitution", readOnly: true, safetyLevel: "LOW" },

  // 知识 / 百科
  { command: "knowledge.search",    namespace: "knowledge",    description: "搜索世界知识引擎。", examples: ['knowledge.search "MSL"', 'knowledge.search "蓝天机"'], requiredPermission: "PUBLIC_READ", targetEngine: "worldKnowledge", readOnly: true, safetyLevel: "LOW" },
  { command: "encyclopedia.search", namespace: "encyclopedia", description: "搜索产品百科。", examples: ['encyclopedia.search "虚拟生活"'], requiredPermission: "PUBLIC_READ", targetEngine: "encyclopedia", readOnly: true, safetyLevel: "LOW" },
  { command: "encyclopedia.write",  namespace: "encyclopedia", description: "写入产品百科（需 Founder）。", examples: ["encyclopedia.write <entryId>"], requiredPermission: "FOUNDER", targetEngine: "encyclopedia", readOnly: false, safetyLevel: "HIGH" },

  // Prompt
  { command: "prompt.generate", namespace: "prompt", description: "生成可复制的工程化 Prompt。", examples: ['prompt.generate --target lovable "新增数列终端"', 'prompt.generate --target codex "修复安卓打包"'], requiredPermission: "USER_LOCAL", targetEngine: "promptForge", readOnly: true, safetyLevel: "LOW", flags: [{ name: "target", values: ["lovable", "codex", "cursor", "claude", "gpt"] }] },

  // 导出
  { command: "export", description: "导出最近输出 / 历史 / 世界 / 模型 / 知识库。", examples: ["export last --format markdown", "export last --format json", "export history --format markdown", "export knowledge --format json"], requiredPermission: "USER_LOCAL", targetEngine: "terminalExport", readOnly: true, safetyLevel: "MEDIUM", flags: [{ name: "format", values: ["markdown", "json"] }, { name: "target", values: ["godot", "unity", "typescript"] }] },

  // Founder
  { command: "founder.status",   namespace: "founder", description: "查看创始人状态。",       examples: ["founder.status"],          requiredPermission: "FOUNDER", targetEngine: "founder",         readOnly: true,  safetyLevel: "MEDIUM" },
  { command: "engine.list",      namespace: "engine",  description: "列出所有引擎。",         examples: ["engine.list"],             requiredPermission: "FOUNDER", targetEngine: "founder",         readOnly: true,  safetyLevel: "MEDIUM" },
  { command: "engine.audit",     namespace: "engine",  description: "审计所有引擎。",         examples: ["engine.audit"],            requiredPermission: "FOUNDER", targetEngine: "founder",         readOnly: true,  safetyLevel: "HIGH" },
  { command: "system.audit",     namespace: "system",  description: "运行整套系统审计。",     examples: ["system.audit"],            requiredPermission: "FOUNDER", targetEngine: "founder",         readOnly: true,  safetyLevel: "HIGH" },
  { command: "knowledge.lock",   namespace: "knowledge", description: "锁定知识条目。",       examples: ["knowledge.lock <entryId>"], requiredPermission: "FOUNDER", targetEngine: "worldKnowledge", readOnly: false, safetyLevel: "HIGH" },
  { command: "route.trace",      namespace: "route",   description: "追踪一条请求的引擎调用链。", examples: ['route.trace "生成一个 NPC 模型"'], requiredPermission: "FOUNDER", targetEngine: "founder", readOnly: true, safetyLevel: "MEDIUM" },
  { command: "terminal.permissions", namespace: "terminal", description: "查看当前可用权限与命令。", examples: ["terminal.permissions"], requiredPermission: "PUBLIC_READ", targetEngine: "terminalSession", readOnly: true, safetyLevel: "LOW" },

  // UI 界面更新引擎
  { command: "ui.summary",     namespace: "ui", description: "查看 UI 模块覆盖、stale 数与审计状态。", examples: ["ui.summary"], requiredPermission: "USER_LOCAL", targetEngine: "uiUpdate", readOnly: true, safetyLevel: "LOW" },
  { command: "ui.audit",       namespace: "ui", description: "运行 UI 模块审计，返回 issues 列表。",   examples: ["ui.audit"],   requiredPermission: "USER_LOCAL", targetEngine: "uiUpdate", readOnly: true, safetyLevel: "LOW" },
  { command: "ui.stale",       namespace: "ui", description: "检测 UI stale（需要刷新）的模块/入口。", examples: ["ui.stale"],   requiredPermission: "USER_LOCAL", targetEngine: "uiUpdate", readOnly: true, safetyLevel: "LOW" },
  { command: "ui.quickstart",  namespace: "ui", description: "查看分层 Quick Start。", examples: ["ui.quickstart --audience PUBLIC", "ui.quickstart --audience ADVANCED"], requiredPermission: "PUBLIC_READ", targetEngine: "uiUpdate", readOnly: true, safetyLevel: "LOW", flags: [{ name: "audience", values: ["PUBLIC", "ADVANCED", "FOUNDER"] }] },
  { command: "ui.routes",      namespace: "ui", description: "运行 Collapsible Sub-Router 审计。",     examples: ["ui.routes"],  requiredPermission: "USER_LOCAL", targetEngine: "subRouter", readOnly: true, safetyLevel: "LOW" },

  // 教程与教学文档引擎 / Learning Docs Engine
  { command: "docs.status",   namespace: "docs", description: "查看学习中心摘要与版本。", examples: ["docs.status"], requiredPermission: "PUBLIC_READ", targetEngine: "learningDocs", readOnly: true, safetyLevel: "LOW" },
  { command: "docs.search",   namespace: "docs", description: "搜索教程 / 模块 / FAQ / 术语。", examples: ['docs.search "world"'], requiredPermission: "PUBLIC_READ", targetEngine: "learningDocs", readOnly: true, safetyLevel: "LOW" },
  { command: "docs.generate", namespace: "docs", description: "按层级生成教程清单。", examples: ["docs.generate beginner", "docs.generate creator", "docs.generate developer", "docs.generate founder"], requiredPermission: "USER_LOCAL", targetEngine: "learningDocs", readOnly: true, safetyLevel: "LOW" },
  { command: "docs.module",   namespace: "docs", description: "查看某个模块文档。", examples: ["docs.module sequence-ai", "docs.module world-engine"], requiredPermission: "PUBLIC_READ", targetEngine: "learningDocs", readOnly: true, safetyLevel: "LOW" },
  { command: "docs.faq",      namespace: "docs", description: "查看 FAQ 列表。", examples: ["docs.faq"], requiredPermission: "PUBLIC_READ", targetEngine: "learningDocs", readOnly: true, safetyLevel: "LOW" },
  { command: "docs.glossary", namespace: "docs", description: "查看术语表。", examples: ["docs.glossary"], requiredPermission: "PUBLIC_READ", targetEngine: "learningDocs", readOnly: true, safetyLevel: "LOW" },
  { command: "docs.audit",    namespace: "docs", description: "运行文档审计。", examples: ["docs.audit"], requiredPermission: "USER_LOCAL", targetEngine: "learningDocs", readOnly: true, safetyLevel: "LOW" },
  { command: "docs.export",   namespace: "docs", description: "导出文档包。", examples: ["docs.export --target user_manual", "docs.export --target founder_manual", "docs.export --target full_documentation_pack"], requiredPermission: "USER_LOCAL", targetEngine: "learningDocs", readOnly: true, safetyLevel: "MEDIUM", flags: [{ name: "target", values: ["user_manual", "beginner_tutorials", "creator_guide", "developer_manual", "founder_manual", "module_docs", "faq", "glossary", "release_notes", "full_documentation_pack"] }] },

  // Text Dynamic Update Engine
  { command: "text.status",   namespace: "text", description: "查看文本动态更新总览。", examples: ["text.status"], requiredPermission: "PUBLIC_READ", targetEngine: "textDynamic", readOnly: true, safetyLevel: "LOW" },
  { command: "text.registry", namespace: "text", description: "查看文本注册表。", examples: ["text.registry", "text.registry --audience PUBLIC"], requiredPermission: "PUBLIC_READ", targetEngine: "textDynamic", readOnly: true, safetyLevel: "LOW", flags: [{ name: "audience", values: ["PUBLIC", "ADVANCED", "FOUNDER"] }] },
  { command: "text.detect",   namespace: "text", description: "运行文本影响检测。", examples: ["text.detect --trigger UI_LAYOUT_CHANGED", "text.detect --trigger CONSTITUTION_UPDATED"], requiredPermission: "USER_LOCAL", targetEngine: "textDynamic", readOnly: false, safetyLevel: "MEDIUM", flags: [{ name: "trigger" }] },
  { command: "text.stale",    namespace: "text", description: "扫描 stale 文本。", examples: ["text.stale"], requiredPermission: "USER_LOCAL", targetEngine: "textDynamic", readOnly: true, safetyLevel: "LOW" },
  { command: "text.generate", namespace: "text", description: "生成文本候选。", examples: ["text.generate --scope quickstart.public", "text.generate --module world-presentation"], requiredPermission: "ADVANCED", targetEngine: "textDynamic", readOnly: false, safetyLevel: "MEDIUM", flags: [{ name: "scope" }, { name: "module" }] },
  { command: "text.diff",     namespace: "text", description: "查看 stale 文本 diff。", examples: ["text.diff"], requiredPermission: "USER_LOCAL", targetEngine: "textDynamic", readOnly: true, safetyLevel: "LOW" },
  { command: "text.review",   namespace: "text", description: "查看文本审查队列。", examples: ["text.review"], requiredPermission: "USER_LOCAL", targetEngine: "textDynamic", readOnly: true, safetyLevel: "LOW" },
  { command: "text.audit",    namespace: "text", description: "运行文本安全审计。", examples: ["text.audit"], requiredPermission: "USER_LOCAL", targetEngine: "textDynamic", readOnly: true, safetyLevel: "MEDIUM" },
  { command: "text.version",  namespace: "text", description: "查看文本版本。", examples: ["text.version"], requiredPermission: "PUBLIC_READ", targetEngine: "textDynamic", readOnly: true, safetyLevel: "LOW" },
  { command: "text.rollback", namespace: "text", description: "回滚到指定文本版本。", examples: ["text.rollback tv_init"], requiredPermission: "FOUNDER", targetEngine: "textDynamic", readOnly: false, safetyLevel: "HIGH" },
  { command: "text.localize", namespace: "text", description: "同步指定语言。", examples: ["text.localize --locale en", "text.localize --locale ja"], requiredPermission: "ADVANCED", targetEngine: "textDynamic", readOnly: false, safetyLevel: "MEDIUM", flags: [{ name: "locale", values: ["zh-CN", "zh-HK", "zh-TW", "en", "ja", "ko", "fr"] }] },
  { command: "text.export",   namespace: "text", description: "导出文本注册表。", examples: ["text.export --format json"], requiredPermission: "USER_LOCAL", targetEngine: "textDynamic", readOnly: true, safetyLevel: "LOW", flags: [{ name: "format", values: ["json", "markdown"] }] },
  // Application Version Leap Engine
  { command: "version.status",     namespace: "version", description: "查看当前版本与跃迁评分摘要。", examples: ["version.status"], requiredPermission: "PUBLIC_READ", targetEngine: "versionLeap", readOnly: true, safetyLevel: "LOW" },
  { command: "version.detect",     namespace: "version", description: "运行版本变更检测。", examples: ["version.detect"], requiredPermission: "USER_LOCAL", targetEngine: "versionLeap", readOnly: true, safetyLevel: "LOW" },
  { command: "version.score",      namespace: "version", description: "计算版本跃迁评分。", examples: ["version.score"], requiredPermission: "USER_LOCAL", targetEngine: "versionLeap", readOnly: true, safetyLevel: "LOW" },
  { command: "version.classify",   namespace: "version", description: "版本类型分类。", examples: ["version.classify"], requiredPermission: "USER_LOCAL", targetEngine: "versionLeap", readOnly: true, safetyLevel: "LOW" },
  { command: "version.suggest",    namespace: "version", description: "生成版本号建议。", examples: ["version.suggest"], requiredPermission: "USER_LOCAL", targetEngine: "versionLeap", readOnly: true, safetyLevel: "LOW" },
  { command: "version.readiness",  namespace: "version", description: "运行发布就绪检查。", examples: ["version.readiness"], requiredPermission: "USER_LOCAL", targetEngine: "versionLeap", readOnly: true, safetyLevel: "MEDIUM" },
  { command: "version.notes",      namespace: "version", description: "生成 Public / Founder 更新日志。", examples: ["version.notes"], requiredPermission: "USER_LOCAL", targetEngine: "versionLeap", readOnly: true, safetyLevel: "LOW" },
  { command: "version.audit",      namespace: "version", description: "运行版本治理审计。", examples: ["version.audit"], requiredPermission: "USER_LOCAL", targetEngine: "versionLeap", readOnly: true, safetyLevel: "MEDIUM" },
  { command: "version.timeline",   namespace: "version", description: "查看版本时间线。", examples: ["version.timeline"], requiredPermission: "PUBLIC_READ", targetEngine: "versionLeap", readOnly: true, safetyLevel: "LOW" },
  { command: "version.migration",  namespace: "version", description: "生成升级迁移计划。", examples: ["version.migration"], requiredPermission: "ADVANCED", targetEngine: "versionLeap", readOnly: true, safetyLevel: "MEDIUM" },
  { command: "version.rollback-plan", namespace: "version", description: "生成回滚计划。", examples: ["version.rollback-plan"], requiredPermission: "ADVANCED", targetEngine: "versionLeap", readOnly: true, safetyLevel: "HIGH" },
  { command: "version.export",     namespace: "version", description: "导出 Release Note 或 Timeline。", examples: ["version.export --format markdown"], requiredPermission: "USER_LOCAL", targetEngine: "versionLeap", readOnly: true, safetyLevel: "LOW", flags: [{ name: "format", values: ["markdown", "json"] }] },
  { command: "version.mark",       namespace: "version", description: "标记版本（release/beta/leap）。", examples: ["version.mark --as release", "version.mark --as beta", "version.mark --as leap"], requiredPermission: "FOUNDER", targetEngine: "versionLeap", readOnly: false, safetyLevel: "HIGH", flags: [{ name: "as", values: ["release", "beta", "leap"] }] },
  // Reality Data Calibration Engine
  { command: "reality.status",      namespace: "reality", description: "现实数据校准引擎状态。", examples: ["reality.status"], requiredPermission: "PUBLIC_READ", targetEngine: "realityData", readOnly: true, safetyLevel: "LOW" },
  { command: "reality.sources",     namespace: "reality", description: "查看外部数据源注册表。", examples: ["reality.sources"], requiredPermission: "PUBLIC_READ", targetEngine: "realityData", readOnly: true, safetyLevel: "LOW" },
  { command: "reality.ingest",      namespace: "reality", description: "接入外部数据。", examples: ['reality.ingest --manual "粘贴榜单数据"'], requiredPermission: "USER_LOCAL", targetEngine: "realityData", readOnly: false, safetyLevel: "MEDIUM" },
  { command: "reality.calibrate",   namespace: "reality", description: "运行现实校准。", examples: ['reality.calibrate "中国关键组织排名为什么下降"'], requiredPermission: "USER_LOCAL", targetEngine: "realityData", readOnly: true, safetyLevel: "MEDIUM" },
  { command: "reality.evidence",    namespace: "reality", description: "查看证据映射。", examples: ["reality.evidence"], requiredPermission: "USER_LOCAL", targetEngine: "realityData", readOnly: true, safetyLevel: "LOW" },
  { command: "reality.variables",   namespace: "reality", description: "提取现实变量。", examples: ['reality.variables "2025 香港大学排名第 30"'], requiredPermission: "USER_LOCAL", targetEngine: "realityData", readOnly: true, safetyLevel: "LOW" },
  { command: "reality.freshness",   namespace: "reality", description: "检测数据新鲜度。", examples: ["reality.freshness"], requiredPermission: "PUBLIC_READ", targetEngine: "realityData", readOnly: true, safetyLevel: "LOW" },
  { command: "reality.credibility", namespace: "reality", description: "评估来源可信度。", examples: ["reality.credibility"], requiredPermission: "PUBLIC_READ", targetEngine: "realityData", readOnly: true, safetyLevel: "LOW" },
  { command: "reality.audit",       namespace: "reality", description: "运行现实数据审计。", examples: ["reality.audit"], requiredPermission: "USER_LOCAL", targetEngine: "realityData", readOnly: true, safetyLevel: "MEDIUM" },
  { command: "reality.recalculate", namespace: "reality", description: "触发现实数据重算。", examples: ["reality.recalculate"], requiredPermission: "USER_LOCAL", targetEngine: "realityData", readOnly: false, safetyLevel: "MEDIUM" },
  { command: "reality.export",      namespace: "reality", description: "导出现实数据。", examples: ["reality.export --format markdown"], requiredPermission: "USER_LOCAL", targetEngine: "realityData", readOnly: true, safetyLevel: "LOW", flags: [{ name: "format", values: ["json", "markdown"] }] },
  // Multi-World Network Engine v0.7
  { command: "multiverse.status",      namespace: "multiverse", description: "多世界网络状态摘要。", examples: ["multiverse.status"], requiredPermission: "PUBLIC_READ", targetEngine: "multiWorld", readOnly: true, safetyLevel: "LOW" },
  { command: "multiverse.create",      namespace: "multiverse", description: "创建一个多世界网络。", examples: ["multiverse.create"], requiredPermission: "USER_LOCAL", targetEngine: "multiWorld", readOnly: false, safetyLevel: "MEDIUM" },
  { command: "multiverse.registry",    namespace: "multiverse", description: "查看世界注册表。", examples: ["multiverse.registry"], requiredPermission: "PUBLIC_READ", targetEngine: "multiWorld", readOnly: true, safetyLevel: "LOW" },
  { command: "multiverse.worlds",      namespace: "multiverse", description: "列出当前世界。", examples: ["multiverse.worlds"], requiredPermission: "PUBLIC_READ", targetEngine: "multiWorld", readOnly: true, safetyLevel: "LOW" },
  { command: "multiverse.portal",      namespace: "multiverse", description: "创建或列出世界门户。", examples: ["multiverse.portal list", "multiverse.portal create"], requiredPermission: "USER_LOCAL", targetEngine: "multiWorld", readOnly: false, safetyLevel: "MEDIUM" },
  { command: "multiverse.travel",      namespace: "multiverse", description: "进入另一个世界。", examples: ["multiverse.travel --to world_x"], requiredPermission: "USER_LOCAL", targetEngine: "multiWorld", readOnly: false, safetyLevel: "MEDIUM", flags: [{ name: "to" }] },
  { command: "multiverse.transfer",    namespace: "multiverse", description: "跨世界资源转移。", examples: ["multiverse.transfer"], requiredPermission: "USER_LOCAL", targetEngine: "multiWorld", readOnly: false, safetyLevel: "MEDIUM" },
  { command: "multiverse.migrate-agent", namespace: "multiverse", description: "NPC / Agent 跨世界迁移。", examples: ["multiverse.migrate-agent"], requiredPermission: "USER_LOCAL", targetEngine: "multiWorld", readOnly: false, safetyLevel: "MEDIUM" },
  { command: "multiverse.relations",   namespace: "multiverse", description: "查看跨世界关系。", examples: ["multiverse.relations"], requiredPermission: "PUBLIC_READ", targetEngine: "multiWorld", readOnly: true, safetyLevel: "LOW" },
  { command: "multiverse.canon",       namespace: "multiverse", description: "检查跨世界正典。", examples: ["multiverse.canon"], requiredPermission: "USER_LOCAL", targetEngine: "multiWorld", readOnly: true, safetyLevel: "MEDIUM" },
  { command: "multiverse.events",      namespace: "multiverse", description: "查看多世界事件。", examples: ["multiverse.events"], requiredPermission: "PUBLIC_READ", targetEngine: "multiWorld", readOnly: true, safetyLevel: "LOW" },
  { command: "multiverse.federation",  namespace: "multiverse", description: "查看 / 生成世界联邦。", examples: ["multiverse.federation"], requiredPermission: "USER_LOCAL", targetEngine: "multiWorld", readOnly: true, safetyLevel: "MEDIUM" },
  { command: "multiverse.conflicts",   namespace: "multiverse", description: "检测世界冲突。", examples: ["multiverse.conflicts"], requiredPermission: "USER_LOCAL", targetEngine: "multiWorld", readOnly: true, safetyLevel: "MEDIUM" },
  { command: "multiverse.sync",        namespace: "multiverse", description: "查看世界同步状态。", examples: ["multiverse.sync"], requiredPermission: "USER_LOCAL", targetEngine: "multiWorld", readOnly: true, safetyLevel: "MEDIUM" },
  { command: "multiverse.snapshot",    namespace: "multiverse", description: "创建多世界快照。", examples: ["multiverse.snapshot"], requiredPermission: "USER_LOCAL", targetEngine: "multiWorld", readOnly: false, safetyLevel: "LOW" },
  { command: "multiverse.compress",    namespace: "multiverse", description: "压缩多世界网络为可读结构。", examples: ["multiverse.compress --target narrative_bible"], requiredPermission: "USER_LOCAL", targetEngine: "multiWorld", readOnly: true, safetyLevel: "LOW", flags: [{ name: "target" }] },
  { command: "multiverse.export",      namespace: "multiverse", description: "导出多世界 Runtime。", examples: ["multiverse.export --target godot", "multiverse.export --target unity", "multiverse.export --target threejs"], requiredPermission: "USER_LOCAL", targetEngine: "multiWorld", readOnly: true, safetyLevel: "MEDIUM", flags: [{ name: "target" }] },

  // Vocabulary Encyclopedia Engine
  { command: "vocab.status",    namespace: "vocab", description: "查看词汇百科总览。", examples: ["vocab.status"], requiredPermission: "PUBLIC_READ", targetEngine: "vocabulary", readOnly: true, safetyLevel: "LOW" },
  { command: "vocab.search",    namespace: "vocab", description: "搜索词条。", examples: ['vocab.search "Full60"', 'vocab.search "常数宇宙"'], requiredPermission: "PUBLIC_READ", targetEngine: "vocabulary", readOnly: true, safetyLevel: "LOW" },
  { command: "vocab.get",       namespace: "vocab", description: "查看单个词条详情。", examples: ["vocab.get full60", "vocab.get constant-universe"], requiredPermission: "PUBLIC_READ", targetEngine: "vocabulary", readOnly: true, safetyLevel: "LOW" },
  { command: "vocab.category",  namespace: "vocab", description: "按分类列出词条。", examples: ["vocab.category CALCULUS_TERM"], requiredPermission: "PUBLIC_READ", targetEngine: "vocabulary", readOnly: true, safetyLevel: "LOW" },
  { command: "vocab.relations", namespace: "vocab", description: "查看词条关系。", examples: ["vocab.relations mother-sequence"], requiredPermission: "PUBLIC_READ", targetEngine: "vocabulary", readOnly: true, safetyLevel: "LOW" },
  { command: "vocab.audit",     namespace: "vocab", description: "运行词汇安全审计。", examples: ["vocab.audit"], requiredPermission: "USER_LOCAL", targetEngine: "vocabulary", readOnly: true, safetyLevel: "MEDIUM" },
  { command: "vocab.localize",  namespace: "vocab", description: "查看本地化覆盖。", examples: ["vocab.localize --locale en"], requiredPermission: "USER_LOCAL", targetEngine: "vocabulary", readOnly: true, safetyLevel: "LOW", flags: [{ name: "locale", values: ["zh-CN","zh-HK","zh-TW","en","ja","ko","fr"] }] },
  { command: "vocab.export",    namespace: "vocab", description: "导出术语表 / Markdown / JSON。", examples: ["vocab.export --target glossary", "vocab.export --target json"], requiredPermission: "USER_LOCAL", targetEngine: "vocabulary", readOnly: true, safetyLevel: "LOW", flags: [{ name: "target", values: ["glossary","markdown","json"] }] },
  { command: "vocab.stale",     namespace: "vocab", description: "扫描 stale 词条。", examples: ["vocab.stale"], requiredPermission: "USER_LOCAL", targetEngine: "vocabulary", readOnly: true, safetyLevel: "LOW" },
  { command: "vocab.patch",     namespace: "vocab", description: "生成词条修订 Prompt。", examples: ["vocab.patch full60"], requiredPermission: "ADVANCED", targetEngine: "vocabulary", readOnly: true, safetyLevel: "MEDIUM" },

  // Cross-Functional Application Calculus
  { command: "cross.status",    namespace: "cross", description: "查看跨功能计算法总览。", examples: ["cross.status"], requiredPermission: "PUBLIC_READ", targetEngine: "crossFunctional", readOnly: true, safetyLevel: "LOW" },
  { command: "cross.intents",   namespace: "cross", description: "列出已注册的跨域意图类型。", examples: ["cross.intents"], requiredPermission: "PUBLIC_READ", targetEngine: "crossFunctional", readOnly: true, safetyLevel: "LOW" },
  { command: "cross.bridges",   namespace: "cross", description: "列出引擎之间的桥接对。", examples: ["cross.bridges"], requiredPermission: "PUBLIC_READ", targetEngine: "crossFunctional", readOnly: true, safetyLevel: "LOW" },
  { command: "cross.workflows", namespace: "cross", description: "列出可用工作流模板（A–E）。", examples: ["cross.workflows"], requiredPermission: "PUBLIC_READ", targetEngine: "crossFunctional", readOnly: true, safetyLevel: "LOW" },
  { command: "cross.examples",  namespace: "cross", description: "查看预置跨域示例。", examples: ["cross.examples"], requiredPermission: "PUBLIC_READ", targetEngine: "crossFunctional", readOnly: true, safetyLevel: "LOW" },
  { command: "cross.run",       namespace: "cross", description: "执行一个跨域意图。", examples: ['cross.run --workflow A', 'cross.run --intent CHARACTER_TO_SONG'], requiredPermission: "USER_LOCAL", targetEngine: "crossFunctional", readOnly: false, safetyLevel: "MEDIUM", flags: [{ name: "workflow", values: ["A","B","C","D","E"] }, { name: "intent" }] },
  { command: "cross.qa",        namespace: "cross", description: "对最近一次跨域执行做 QA 校验。", examples: ["cross.qa"], requiredPermission: "USER_LOCAL", targetEngine: "crossFunctional", readOnly: true, safetyLevel: "MEDIUM" },
  { command: "cross.audit",     namespace: "cross", description: "运行跨域安全审计。", examples: ["cross.audit"], requiredPermission: "USER_LOCAL", targetEngine: "crossFunctional", readOnly: true, safetyLevel: "MEDIUM" },
  { command: "cross.export",    namespace: "cross", description: "把跨域输出导出到目标引擎。", examples: ["cross.export --target narrative", "cross.export --target vocal", "cross.export --target world"], requiredPermission: "USER_LOCAL", targetEngine: "crossFunctional", readOnly: true, safetyLevel: "MEDIUM", flags: [{ name: "target" }] },

  { command: "missing.status",         namespace: "missing", description: "查看系统缺层识别计算法总览。", examples: ["missing.status"], requiredPermission: "PUBLIC_READ", targetEngine: "missingLayer", readOnly: true, safetyLevel: "LOW" },
  { command: "missing.scan",           namespace: "missing", description: "执行一次系统缺层扫描。", examples: ["missing.scan"], requiredPermission: "USER_LOCAL", targetEngine: "missingLayer", readOnly: true, safetyLevel: "LOW" },
  { command: "missing.layers",         namespace: "missing", description: "列出缺层条目。", examples: ["missing.layers"], requiredPermission: "USER_LOCAL", targetEngine: "missingLayer", readOnly: true, safetyLevel: "LOW" },
  { command: "missing.gaps",           namespace: "missing", description: "查看系统层级地图与缺层。", examples: ["missing.gaps"], requiredPermission: "USER_LOCAL", targetEngine: "missingLayer", readOnly: true, safetyLevel: "LOW" },
  { command: "missing.recommend",      namespace: "missing", description: "生成下一步升级建议。", examples: ["missing.recommend"], requiredPermission: "USER_LOCAL", targetEngine: "missingLayer", readOnly: true, safetyLevel: "LOW" },
  { command: "missing.fragmentation",  namespace: "missing", description: "查看功能碎片化报告。", examples: ["missing.fragmentation"], requiredPermission: "USER_LOCAL", targetEngine: "missingLayer", readOnly: true, safetyLevel: "LOW" },
  { command: "missing.runtime",        namespace: "missing", description: "查看 Runtime 缺口。", examples: ["missing.runtime"], requiredPermission: "USER_LOCAL", targetEngine: "missingLayer", readOnly: true, safetyLevel: "LOW" },
  { command: "missing.objects",        namespace: "missing", description: "查看对象层缺口。", examples: ["missing.objects"], requiredPermission: "USER_LOCAL", targetEngine: "missingLayer", readOnly: true, safetyLevel: "LOW" },
  { command: "missing.cross",          namespace: "missing", description: "查看跨功能桥缺口。", examples: ["missing.cross"], requiredPermission: "USER_LOCAL", targetEngine: "missingLayer", readOnly: true, safetyLevel: "LOW" },
  { command: "missing.governance",     namespace: "missing", description: "查看治理缺口。", examples: ["missing.governance"], requiredPermission: "USER_LOCAL", targetEngine: "missingLayer", readOnly: true, safetyLevel: "LOW" },
  { command: "missing.docs",           namespace: "missing", description: "查看用户理解 / 文档缺口。", examples: ["missing.docs"], requiredPermission: "USER_LOCAL", targetEngine: "missingLayer", readOnly: true, safetyLevel: "LOW" },
  { command: "missing.commercial",     namespace: "missing", description: "查看商业展示缺口。", examples: ["missing.commercial"], requiredPermission: "USER_LOCAL", targetEngine: "missingLayer", readOnly: true, safetyLevel: "LOW" },
  { command: "missing.overgrowth",     namespace: "missing", description: "查看过度生长风险。", examples: ["missing.overgrowth"], requiredPermission: "USER_LOCAL", targetEngine: "missingLayer", readOnly: true, safetyLevel: "MEDIUM" },
  { command: "missing.qa",             namespace: "missing", description: "对缺层结果做 QA。", examples: ["missing.qa"], requiredPermission: "USER_LOCAL", targetEngine: "missingLayer", readOnly: true, safetyLevel: "MEDIUM" },
  { command: "missing.export",         namespace: "missing", description: "导出缺层检测最新结果。", examples: ["missing.export latest"], requiredPermission: "USER_LOCAL", targetEngine: "missingLayer", readOnly: true, safetyLevel: "MEDIUM" },

  { command: "role.status",      namespace: "role", description: "查看数字角色计算法总览。", examples: ["role.status"], requiredPermission: "PUBLIC_READ", targetEngine: "digitalRoles", readOnly: true, safetyLevel: "LOW" },
  { command: "role.list",        namespace: "role", description: "列出所有数字角色。", examples: ["role.list"], requiredPermission: "PUBLIC_READ", targetEngine: "digitalRoles", readOnly: true, safetyLevel: "LOW" },
  { command: "role.get",         namespace: "role", description: "查看数字角色详情。", examples: ["role.get role-architect"], requiredPermission: "PUBLIC_READ", targetEngine: "digitalRoles", readOnly: true, safetyLevel: "LOW" },
  { command: "role.assign",      namespace: "role", description: "为任务分配数字角色。", examples: ["role.assign 把这个想法做成产品"], requiredPermission: "USER_LOCAL", targetEngine: "digitalRoles", readOnly: true, safetyLevel: "LOW" },
  { command: "role.workflow",    namespace: "role", description: "查看标准协作链。", examples: ["role.workflow"], requiredPermission: "USER_LOCAL", targetEngine: "digitalRoles", readOnly: true, safetyLevel: "LOW" },
  { command: "role.run",         namespace: "role", description: "运行数字团队工作流。", examples: ["role.run --workflow PRODUCT_BUILD_CHAIN"], requiredPermission: "USER_LOCAL", targetEngine: "digitalRoles", readOnly: false, safetyLevel: "MEDIUM" },
  { command: "role.conflicts",   namespace: "role", description: "检测当前角色冲突。", examples: ["role.conflicts"], requiredPermission: "USER_LOCAL", targetEngine: "digitalRoles", readOnly: true, safetyLevel: "LOW" },
  { command: "role.qa",          namespace: "role", description: "运行数字角色 QA。", examples: ["role.qa"], requiredPermission: "USER_LOCAL", targetEngine: "digitalRoles", readOnly: true, safetyLevel: "MEDIUM" },
  { command: "role.governance",  namespace: "role", description: "运行数字角色治理审查。", examples: ["role.governance"], requiredPermission: "USER_LOCAL", targetEngine: "digitalRoles", readOnly: true, safetyLevel: "MEDIUM" },
  { command: "role.save",        namespace: "role", description: "保存数字角色输出到 Workspace。", examples: ["role.save"], requiredPermission: "USER_LOCAL", targetEngine: "digitalRoles", readOnly: false, safetyLevel: "MEDIUM" },
  { command: "role.export",      namespace: "role", description: "导出数字角色运行结果。", examples: ["role.export"], requiredPermission: "USER_LOCAL", targetEngine: "digitalRoles", readOnly: true, safetyLevel: "MEDIUM" },

  { command: "app.status",   namespace: "app", description: "查看 Aether App Runtime 状态。", examples: ["app.status"], requiredPermission: "PUBLIC_READ", targetEngine: "appRuntime", readOnly: true, safetyLevel: "LOW" },
  { command: "app.create",   namespace: "app", description: "从一个想法生成 App 项目。", examples: ["app.create 做一个番茄钟网页"], requiredPermission: "USER_LOCAL", targetEngine: "appRuntime", readOnly: false, safetyLevel: "MEDIUM" },
  { command: "app.projects", namespace: "app", description: "列出 Workspace 中的 App 项目。", examples: ["app.projects"], requiredPermission: "USER_LOCAL", targetEngine: "appRuntime", readOnly: true, safetyLevel: "LOW" },
  { command: "app.get",      namespace: "app", description: "查看指定 App 项目。", examples: ["app.get latest"], requiredPermission: "USER_LOCAL", targetEngine: "appRuntime", readOnly: true, safetyLevel: "LOW" },
  { command: "app.preview",  namespace: "app", description: "查看 App 预览配置。", examples: ["app.preview latest"], requiredPermission: "USER_LOCAL", targetEngine: "appRuntime", readOnly: true, safetyLevel: "LOW" },
  { command: "app.files",    namespace: "app", description: "列出 App 项目文件树。", examples: ["app.files latest"], requiredPermission: "USER_LOCAL", targetEngine: "appRuntime", readOnly: true, safetyLevel: "LOW" },
  { command: "app.qa",       namespace: "app", description: "运行 App QA。", examples: ["app.qa latest"], requiredPermission: "USER_LOCAL", targetEngine: "appRuntime", readOnly: true, safetyLevel: "MEDIUM" },
  { command: "app.export",   namespace: "app", description: "生成 App 导出包。", examples: ["app.export latest"], requiredPermission: "USER_LOCAL", targetEngine: "appRuntime", readOnly: true, safetyLevel: "MEDIUM" },
  { command: "app.handoff",  namespace: "app", description: "生成外部工具 Handoff Pack。", examples: ["app.handoff latest --target codex"], requiredPermission: "USER_LOCAL", targetEngine: "appRuntime", readOnly: true, safetyLevel: "MEDIUM" },
  { command: "app.save",     namespace: "app", description: "保存 App 项目到 Workspace。", examples: ["app.save latest"], requiredPermission: "USER_LOCAL", targetEngine: "appRuntime", readOnly: false, safetyLevel: "MEDIUM" },

  { command: "agentbind.status",      namespace: "agentbind", description: "查看 Agent 绑定计算法总览。", examples: ["agentbind.status"], requiredPermission: "PUBLIC_READ", targetEngine: "agentBinding", readOnly: true, safetyLevel: "LOW" },
  { command: "agentbind.list",        namespace: "agentbind", description: "列出所有 Agent Binding。", examples: ["agentbind.list"], requiredPermission: "PUBLIC_READ", targetEngine: "agentBinding", readOnly: true, safetyLevel: "LOW" },
  { command: "agentbind.get",         namespace: "agentbind", description: "查看 Agent Binding 详情。", examples: ["agentbind.get AETHER_APP_BUILDER_AGENT"], requiredPermission: "PUBLIC_READ", targetEngine: "agentBinding", readOnly: true, safetyLevel: "LOW" },
  { command: "agentbind.knowledge",   namespace: "agentbind", description: "查看 Binding 的知识层绑定。", examples: ["agentbind.knowledge AETHER_APP_BUILDER_AGENT"], requiredPermission: "USER_LOCAL", targetEngine: "agentBinding", readOnly: true, safetyLevel: "LOW" },
  { command: "agentbind.personality", namespace: "agentbind", description: "查看 Binding 的人格层绑定。", examples: ["agentbind.personality AETHER_APP_BUILDER_AGENT"], requiredPermission: "USER_LOCAL", targetEngine: "agentBinding", readOnly: true, safetyLevel: "LOW" },
  { command: "agentbind.context",     namespace: "agentbind", description: "构建并预览 Agent 上下文。", examples: ["agentbind.context AETHER_APP_BUILDER_AGENT"], requiredPermission: "USER_LOCAL", targetEngine: "agentBinding", readOnly: true, safetyLevel: "LOW" },
  { command: "agentbind.run",         namespace: "agentbind", description: "运行指定 Agent Binding。", examples: ["agentbind.run AETHER_APP_BUILDER_AGENT \"做一个番茄钟网页\""], requiredPermission: "USER_LOCAL", targetEngine: "agentBinding", readOnly: false, safetyLevel: "MEDIUM" },
  { command: "agentbind.qa",          namespace: "agentbind", description: "运行 Agent Binding QA。", examples: ["agentbind.qa AETHER_APP_BUILDER_AGENT"], requiredPermission: "USER_LOCAL", targetEngine: "agentBinding", readOnly: true, safetyLevel: "MEDIUM" },
  { command: "agentbind.audit",       namespace: "agentbind", description: "审计指定 Agent Binding。", examples: ["agentbind.audit AETHER_APP_BUILDER_AGENT"], requiredPermission: "USER_LOCAL", targetEngine: "agentBinding", readOnly: true, safetyLevel: "MEDIUM" },
  { command: "agentbind.export",      namespace: "agentbind", description: "导出 Agent Binding Profile。", examples: ["agentbind.export AETHER_APP_BUILDER_AGENT"], requiredPermission: "USER_LOCAL", targetEngine: "agentBinding", readOnly: true, safetyLevel: "MEDIUM" },
  { command: "agentbind.create",      namespace: "agentbind", description: "创建新 Binding 草案（占位）。", examples: ["agentbind.create"], requiredPermission: "USER_LOCAL", targetEngine: "agentBinding", readOnly: false, safetyLevel: "MEDIUM" },

  { command: "code.status",      namespace: "code", description: "查看 Aether Code Sandbox Bridge 总览。", examples: ["code.status"], requiredPermission: "PUBLIC_READ", targetEngine: "codeSandbox", readOnly: true, safetyLevel: "LOW" },
  { command: "code.run",         namespace: "code", description: "对指定 idea/项目运行代码沙箱（默认 STATIC_HTML）。", examples: ["code.run 做一个番茄钟"], requiredPermission: "USER_LOCAL", targetEngine: "codeSandbox", readOnly: false, safetyLevel: "MEDIUM" },
  { command: "code.simulate",    namespace: "code", description: "模拟构建运行。", examples: ["code.simulate 待办 React App"], requiredPermission: "USER_LOCAL", targetEngine: "codeSandbox", readOnly: false, safetyLevel: "MEDIUM" },
  { command: "code.logs",        namespace: "code", description: "查看最新运行日志。", examples: ["code.logs latest"], requiredPermission: "USER_LOCAL", targetEngine: "codeSandbox", readOnly: true, safetyLevel: "LOW" },
  { command: "code.errors",      namespace: "code", description: "查看最新运行错误摘要。", examples: ["code.errors latest"], requiredPermission: "USER_LOCAL", targetEngine: "codeSandbox", readOnly: true, safetyLevel: "LOW" },
  { command: "code.repair",      namespace: "code", description: "查看修复建议。", examples: ["code.repair latest"], requiredPermission: "USER_LOCAL", targetEngine: "codeSandbox", readOnly: true, safetyLevel: "LOW" },
  { command: "code.patch",       namespace: "code", description: "查看 Patch 草案。", examples: ["code.patch latest"], requiredPermission: "USER_LOCAL", targetEngine: "codeSandbox", readOnly: true, safetyLevel: "MEDIUM" },
  { command: "code.qa",          namespace: "code", description: "查看代码沙箱 QA。", examples: ["code.qa latest"], requiredPermission: "USER_LOCAL", targetEngine: "codeSandbox", readOnly: true, safetyLevel: "MEDIUM" },
  { command: "code.codex-pack",  namespace: "code", description: "生成 Codex 修复包。", examples: ["code.codex-pack latest"], requiredPermission: "USER_LOCAL", targetEngine: "codeSandbox", readOnly: false, safetyLevel: "MEDIUM" },
  { command: "code.cursor-pack", namespace: "code", description: "生成 Cursor 修复包。", examples: ["code.cursor-pack latest"], requiredPermission: "USER_LOCAL", targetEngine: "codeSandbox", readOnly: false, safetyLevel: "MEDIUM" },
  { command: "code.rerun",       namespace: "code", description: "重新运行最近一次代码沙箱。", examples: ["code.rerun latest"], requiredPermission: "USER_LOCAL", targetEngine: "codeSandbox", readOnly: false, safetyLevel: "MEDIUM" },

  { command: "webllm.status",         namespace: "webllm", description: "查看 WebLLM 运行时与可用性。", examples: ["webllm.status"], requiredPermission: "PUBLIC_READ", targetEngine: "webllm", readOnly: true, safetyLevel: "LOW" },
  { command: "webllm.models",         namespace: "webllm", description: "列出 WebLLM 模型注册表。", examples: ["webllm.models"], requiredPermission: "PUBLIC_READ", targetEngine: "webllm", readOnly: true, safetyLevel: "LOW" },
  { command: "webllm.load",           namespace: "webllm", description: "加载指定 WebLLM 模型。", examples: ["webllm.load SMALL_CHAT_MODEL"], requiredPermission: "USER_LOCAL", targetEngine: "webllm", readOnly: false, safetyLevel: "MEDIUM" },
  { command: "webllm.run",            namespace: "webllm", description: "运行 WebLLM 提示。", examples: ["webllm.run \"生成番茄钟 README\""], requiredPermission: "USER_LOCAL", targetEngine: "webllm", readOnly: false, safetyLevel: "MEDIUM" },
  { command: "webllm.prompt-preview", namespace: "webllm", description: "预览最近一次运行的 prompt。", examples: ["webllm.prompt-preview"], requiredPermission: "USER_LOCAL", targetEngine: "webllm", readOnly: true, safetyLevel: "LOW" },
  { command: "webllm.neuro",          namespace: "webllm", description: "查看最近的神经启发控制报告。", examples: ["webllm.neuro latest"], requiredPermission: "USER_LOCAL", targetEngine: "webllm", readOnly: true, safetyLevel: "LOW" },
  { command: "webllm.qa",             namespace: "webllm", description: "查看最近一次 WebLLM QA。", examples: ["webllm.qa latest"], requiredPermission: "USER_LOCAL", targetEngine: "webllm", readOnly: true, safetyLevel: "MEDIUM" },
  { command: "webllm.fallback",       namespace: "webllm", description: "查看当前 fallback 模式。", examples: ["webllm.fallback"], requiredPermission: "PUBLIC_READ", targetEngine: "webllm", readOnly: true, safetyLevel: "LOW" },
  { command: "webllm.audit",          namespace: "webllm", description: "查看 WebLLM Workspace 审计记录。", examples: ["webllm.audit"], requiredPermission: "USER_LOCAL", targetEngine: "webllm", readOnly: true, safetyLevel: "MEDIUM" },

  { command: "weblcm.status",         namespace: "weblcm", description: "查看 WebLCM 运行时与后端可用性。", examples: ["weblcm.status"], requiredPermission: "PUBLIC_READ", targetEngine: "weblcm", readOnly: true, safetyLevel: "LOW" },
  { command: "weblcm.extract",        namespace: "weblcm", description: "从文本抽取概念。", examples: ["weblcm.extract \"做一个番茄钟网页\""], requiredPermission: "USER_LOCAL", targetEngine: "weblcm", readOnly: false, safetyLevel: "MEDIUM" },
  { command: "weblcm.compress",       namespace: "weblcm", description: "压缩最近一次运行的概念。", examples: ["weblcm.compress latest"], requiredPermission: "USER_LOCAL", targetEngine: "weblcm", readOnly: true, safetyLevel: "LOW" },
  { command: "weblcm.chain",          namespace: "weblcm", description: "查看最近一次概念链。", examples: ["weblcm.chain latest"], requiredPermission: "USER_LOCAL", targetEngine: "weblcm", readOnly: true, safetyLevel: "LOW" },
  { command: "weblcm.graph",          namespace: "weblcm", description: "查看最近一次概念图谱。", examples: ["weblcm.graph latest"], requiredPermission: "USER_LOCAL", targetEngine: "weblcm", readOnly: true, safetyLevel: "LOW" },
  { command: "weblcm.search",         namespace: "weblcm", description: "在概念库中检索概念。", examples: ["weblcm.search \"世界主题曲\""], requiredPermission: "USER_LOCAL", targetEngine: "weblcm", readOnly: true, safetyLevel: "LOW" },
  { command: "weblcm.predict",        namespace: "weblcm", description: "预测最近一次概念链的后继概念。", examples: ["weblcm.predict latest"], requiredPermission: "USER_LOCAL", targetEngine: "weblcm", readOnly: true, safetyLevel: "MEDIUM" },
  { command: "weblcm.expand",         namespace: "weblcm", description: "生成 WebLLM 展开 Prompt。", examples: ["weblcm.expand latest"], requiredPermission: "USER_LOCAL", targetEngine: "weblcm", readOnly: true, safetyLevel: "MEDIUM" },
  { command: "weblcm.qa",             namespace: "weblcm", description: "查看最近一次 WebLCM QA 报告。", examples: ["weblcm.qa latest"], requiredPermission: "USER_LOCAL", targetEngine: "weblcm", readOnly: true, safetyLevel: "MEDIUM" },
 { command: "weblcm.audit",          namespace: "weblcm", description: "查看 WebLCM Workspace 审计记录。", examples: ["weblcm.audit"], requiredPermission: "USER_LOCAL", targetEngine: "weblcm", readOnly: true, safetyLevel: "MEDIUM" },
 { command: "webk.status",   namespace: "webk", description: "查看 Web 知识三体运行时状态。", examples: ["webk.status"], requiredPermission: "PUBLIC_READ", targetEngine: "web-knowledge", readOnly: true, safetyLevel: "LOW" },
 { command: "webk.index",    namespace: "webk", description: "查看本地知识索引概览。", examples: ["webk.index"], requiredPermission: "USER_LOCAL", targetEngine: "web-knowledge", readOnly: true, safetyLevel: "LOW" },
 { command: "webk.search",   namespace: "webk", description: "在 WebLKM 中检索知识。", examples: ["webk.search \"App Runtime\""], requiredPermission: "USER_LOCAL", targetEngine: "web-knowledge", readOnly: true, safetyLevel: "LOW" },
 { command: "webk.route",    namespace: "webk", description: "为意图生成 WebCM 计算法路线。", examples: ["webk.route \"做一个番茄钟\""], requiredPermission: "USER_LOCAL", targetEngine: "web-knowledge", readOnly: true, safetyLevel: "MEDIUM" },
 { command: "webk.constants",namespace: "webk", description: "为任务生成 WebCoM 常数约束包。", examples: ["webk.constants \"运行代码\""], requiredPermission: "USER_LOCAL", targetEngine: "web-knowledge", readOnly: true, safetyLevel: "MEDIUM" },
 { command: "webk.run",      namespace: "webk", description: "运行 WebLKM→WebCM→WebCoM 全链路。", examples: ["webk.run \"做一个待办网页\""], requiredPermission: "USER_LOCAL", targetEngine: "web-knowledge", readOnly: false, safetyLevel: "MEDIUM" },
 { command: "webk.qa",       namespace: "webk", description: "查看三体最新 QA 报告。", examples: ["webk.qa latest"], requiredPermission: "USER_LOCAL", targetEngine: "web-knowledge", readOnly: true, safetyLevel: "MEDIUM" },
 { command: "webk.audit",    namespace: "webk", description: "查看三体审计记录。", examples: ["webk.audit"], requiredPermission: "USER_LOCAL", targetEngine: "web-knowledge", readOnly: true, safetyLevel: "MEDIUM" },
 { command: "weblkm.status", namespace: "weblkm", description: "查看 WebLKM 状态。", examples: ["weblkm.status"], requiredPermission: "USER_LOCAL", targetEngine: "weblkm", readOnly: true, safetyLevel: "LOW" },
 { command: "weblkm.search", namespace: "weblkm", description: "WebLKM 知识检索。", examples: ["weblkm.search \"沙箱\""], requiredPermission: "USER_LOCAL", targetEngine: "weblkm", readOnly: true, safetyLevel: "LOW" },
 { command: "webcm.status",  namespace: "webcm", description: "查看 WebCM 状态。", examples: ["webcm.status"], requiredPermission: "USER_LOCAL", targetEngine: "webcm", readOnly: true, safetyLevel: "LOW" },
 { command: "webcm.select",  namespace: "webcm", description: "为意图选择计算法。", examples: ["webcm.select \"修复代码错误\""], requiredPermission: "USER_LOCAL", targetEngine: "webcm", readOnly: true, safetyLevel: "MEDIUM" },
 { command: "webcom.status", namespace: "webcom", description: "查看 WebCoM 状态。", examples: ["webcom.status"], requiredPermission: "USER_LOCAL", targetEngine: "webcom", readOnly: true, safetyLevel: "LOW" },
 { command: "webcom.check",  namespace: "webcom", description: "检查输出是否违背常数。", examples: ["webcom.check latest"], requiredPermission: "USER_LOCAL", targetEngine: "webcom", readOnly: true, safetyLevel: "MEDIUM" },
 { command: "webcap.status",      namespace: "webcap", description: "查看 WebXX 能力模型注册表状态。", examples: ["webcap.status"], requiredPermission: "PUBLIC_READ", targetEngine: "web-capability", readOnly: true, safetyLevel: "LOW" },
 { command: "webcap.list",        namespace: "webcap", description: "列出所有 WebXX 能力模型。", examples: ["webcap.list"], requiredPermission: "PUBLIC_READ", targetEngine: "web-capability", readOnly: true, safetyLevel: "LOW" },
 { command: "webcap.run",         namespace: "webcap", description: "自动路由并运行能力模型。", examples: ["webcap.run \"做一个歌词 prompt 生成器\""], requiredPermission: "USER_LOCAL", targetEngine: "web-capability", readOnly: false, safetyLevel: "MEDIUM" },
 { command: "webcap.get",         namespace: "webcap", description: "查看指定能力模型详情。", examples: ["webcap.get WEB_CODE_M"], requiredPermission: "USER_LOCAL", targetEngine: "web-capability", readOnly: true, safetyLevel: "LOW" },
 { command: "webcap.qa",          namespace: "webcap", description: "查看最近一次能力模型 QA。", examples: ["webcap.qa latest"], requiredPermission: "USER_LOCAL", targetEngine: "web-capability", readOnly: true, safetyLevel: "MEDIUM" },
 { command: "webcap.audit",       namespace: "webcap", description: "查看能力模型 Workspace 审计。", examples: ["webcap.audit"], requiredPermission: "USER_LOCAL", targetEngine: "web-capability", readOnly: true, safetyLevel: "MEDIUM" },
 { command: "webcode.run",        namespace: "webcap", description: "直接运行 WebCodeM。",      examples: ["webcode.run \"修复 React import 错误\""], requiredPermission: "USER_LOCAL", targetEngine: "web-capability", readOnly: false, safetyLevel: "MEDIUM" },
 { command: "webproduct.run",     namespace: "webcap", description: "直接运行 WebProductM。",   examples: ["webproduct.run \"把想法拆成 MVP\""],     requiredPermission: "USER_LOCAL", targetEngine: "web-capability", readOnly: false, safetyLevel: "MEDIUM" },
 { command: "webmusic.run",       namespace: "webcap", description: "直接运行 WebMusicM。",     examples: ["webmusic.run \"为蓝天机生成角色歌\""], requiredPermission: "USER_LOCAL", targetEngine: "web-capability", readOnly: false, safetyLevel: "MEDIUM" },
 { command: "webstory.run",       namespace: "webcap", description: "直接运行 WebStoryM。",     examples: ["webstory.run \"生成开场剧情\""],       requiredPermission: "USER_LOCAL", targetEngine: "web-capability", readOnly: false, safetyLevel: "MEDIUM" },
 { command: "webresearch.run",    namespace: "webcap", description: "直接运行 WebResearchM。",  examples: ["webresearch.run \"整理本地知识报告\""],requiredPermission: "USER_LOCAL", targetEngine: "web-capability", readOnly: false, safetyLevel: "MEDIUM" },
 { command: "webstrategy.run",    namespace: "webcap", description: "直接运行 WebStrategyM。",  examples: ["webstrategy.run \"下一步该补什么\""], requiredPermission: "USER_LOCAL", targetEngine: "web-capability", readOnly: false, safetyLevel: "MEDIUM" },
];




export function findCommand(name: string): CommandDefinition | undefined {
  return TERMINAL_COMMANDS.find((c) => c.command === name);
}

export function listCommands(): CommandDefinition[] {
  return [...TERMINAL_COMMANDS];
}
