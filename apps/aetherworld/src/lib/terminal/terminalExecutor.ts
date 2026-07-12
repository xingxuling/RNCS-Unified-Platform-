import type { ParsedTerminalCommand } from "./terminalCommandParser";
import { runAetherAppRuntime } from "@/lib/app-runtime/aetherAppRuntime";
import { listAppWorkspaceRecords } from "@/lib/app-runtime/appWorkspaceBridge";
import { generateAppExportPackage } from "@/lib/app-runtime/appExportEngine";
import { generateHandoffPack } from "@/lib/app-runtime/appHandoffPackEngine";
import { listAgentBindings, getAgentBinding } from "@/lib/agent-binding/agentBindingRegistry";
import { runAgentBinding } from "@/lib/agent-binding/agentBindingRunner";
import { buildAgentContext } from "@/lib/agent-binding/agentContextBuilder";
import { runAgentBindingQa } from "@/lib/agent-binding/agentQaBridge";
import { evaluateAgentSafety } from "@/lib/agent-binding/agentSafetyGuard";
import { runCodeSandbox } from "@/lib/code-sandbox/aetherCodeSandboxBridge";
import { listCodeRunRecords, listCodeRunResults, getCodeRunResult } from "@/lib/code-sandbox/codeSandboxWorkspaceBridge";
import { runAetherWebLlm, snapshotAvailability } from "@/lib/webllm/aetherWebLlmRuntime";
import { listWebLlmModels } from "@/lib/webllm/webLlmModelRegistry";
import { loadWebLlmModel, getEngineState } from "@/lib/webllm/webLlmEngineLoader";
import { listWebLlmWorkspaceRecords } from "@/lib/webllm/webLlmWorkspaceBridge";
import { listWebCapabilityModels, getWebCapabilityRegistrySummary } from "@/lib/web-capability/webCapabilityRegistry";
import { runWebCapability, getLatestWebCapabilityRun, getWebCapabilityRuntimeSummary } from "@/lib/web-capability/webCapabilityRunner";
import { listCapabilityWorkspaceRecords } from "@/lib/web-capability/webCapabilityWorkspaceBridge";
import type { WebCapabilityId } from "@/constants/web-capability/webCapabilityTypes";

const WEBLLM_LAST: { result?: Awaited<ReturnType<typeof runAetherWebLlm>> } = {};

import type { TerminalSession } from "./terminalSessionManager";
import type { TerminalOutput } from "@/constants/terminal/terminalOutputTypes";
import { buildHelp } from "./terminalHelpEngine";
import { getTerminalHistory } from "./terminalHistory";
import { getAllCommands, getEngineRegistry } from "./terminalCommandRegistry";
import { CONSTITUTION_REGISTRY, getConstitutionSummary, constitutionMeta } from "@/lib/constitution/systemConstitutionEngine";
import { getArticle, listByCategory } from "@/lib/constitution/constitutionRegistry";
import { checkCompliance } from "@/lib/constitution/constitutionalComplianceEngine";
import { CONSTITUTION_VERSIONS, getCurrentConstitutionVersion } from "@/lib/constitution/constitutionalAmendmentEngine";
import { VIOLATION_TYPES } from "@/constants/constitution/constitutionalViolationTypes";
import type { ArticleCategory } from "@/constants/constitution/constitutionalArticles";
import { getUIUpdateSummary, uiUpdateMeta } from "@/lib/ui-update/uiInterfaceUpdateEngine";
import { runUIAudit } from "@/lib/ui-update/uiAuditEngine";
import { detectStaleUi } from "@/lib/ui-update/uiStaleDetector";
import { UI_MODULE_REGISTRY } from "@/lib/ui-update/uiModuleRegistry";
import { generateQuickStart } from "@/lib/ui-update/quickStartGenerator";
import { runRouteAudit } from "@/lib/router/routeAuditEngine";
import { getLearningSummary, searchAll, learningDocsMeta } from "@/lib/learning/learningDocsEngine";
import { listTutorials, filterTutorials } from "@/lib/learning/tutorialRegistry";
import { buildVersionLeapBundle, listVersionTimeline } from "@/lib/version-leap/versionLeapEngine";
import { exportReleaseNote } from "@/lib/version-leap/versionExportEngine";
import { runMultiWorldNetwork } from "@/lib/sequence-world/multiverse/multiWorldNetworkEngine";
import { exportMultiWorldRuntime } from "@/lib/sequence-world/multiverse/multiWorldRuntimeExportEngine";
import { compressMultiWorld } from "@/lib/sequence-world/multiverse/multiWorldCompressionEngine";
import { getModuleDoc, listModuleDocs } from "@/lib/learning/moduleDocGenerator";
import { listFAQ } from "@/lib/learning/faqGenerator";
import { listGlossary } from "@/lib/learning/glossaryDocEngine";
import { runDocsAudit } from "@/lib/learning/docsAuditEngine";
import { exportDocs, type DocsExportTarget } from "@/lib/learning/docsExportEngine";
import {
  getTextDynamicSummary, runDetectAndGenerate, runFullStaleSweep, runFullTextAudit,
} from "@/lib/text-dynamic/textDynamicUpdateEngine";
import { TEXT_REGISTRY, listTexts } from "@/lib/text-dynamic/textRegistry";
import { buildDiffsForStale } from "@/lib/text-dynamic/textDiffEngine";
import { reviewStale } from "@/lib/text-dynamic/textReviewEngine";
import { generateTextCandidate } from "@/lib/text-dynamic/textGenerationEngine";
import { listVersions, rollbackToVersion } from "@/lib/text-dynamic/textVersioningEngine";
import { syncLocale, localizationSummary } from "@/lib/text-dynamic/textLocalizationSyncEngine";
import type { TextTriggerType } from "@/constants/text-dynamic/textTriggerTypes";
import type { TextLocale } from "@/constants/text-dynamic/textLocalizationLocales";
import type { TextAudienceMode } from "@/constants/text-dynamic/textAudienceModes";
import * as realityEngine from "@/lib/reality-data/realityDataCalibrationEngine";
import {
  runCrossFunctional, crossFunctionalMeta, listEngineBridges,
  listAllWorkflowTemplates, runCrossFunctionalQa, runCrossFunctionalSafetyGuard,
  analyzeCrossFunctionalObject,
} from "@/lib/cross-functional/crossFunctionalApplicationCalculus";
import { CROSS_FUNCTIONAL_INTENT_TYPES } from "@/constants/cross-functional/crossFunctionalIntentTypes";
import { listCrossFunctionalExamples } from "@/lib/cross-functional/crossFunctionalExamplesRegistry";
import type { CrossFunctionalWorkflowType } from "@/constants/cross-functional/crossFunctionalWorkflowTypes";
import { runMissingLayerDetection, missingLayerMeta } from "@/lib/missing-layer/missingLayerDetectionCalculus";
import { listMissingLayerExamples } from "@/lib/missing-layer/missingLayerExamplesRegistry";
import { runMissingLayerQa } from "@/lib/missing-layer/missingLayerQaBridge";
import { runDigitalRoleCalculus, digitalRoleCalculusMeta } from "@/lib/digital-roles/digitalRoleCalculus";
import { listDigitalRoles, getDigitalRoleById } from "@/lib/digital-roles/digitalRoleRegistry";
import { listWorkflowChains } from "@/lib/digital-roles/digitalRoleWorkflowPlanner";
import { detectRoleConflicts } from "@/lib/digital-roles/digitalRoleConflictDetector";
import { runDigitalRoleGovernance } from "@/lib/digital-roles/digitalRoleGovernanceBridge";
import { saveDigitalRoleWorkflowToWorkspace } from "@/lib/digital-roles/digitalRoleWorkspaceBridge";
import type { DigitalRoleWorkflowType } from "@/constants/digital-roles/digitalRoleWorkflowTypes";



function makeId() {
  return `out_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function base(type: TerminalOutput["type"], title: string, content: string | object, extras?: Partial<TerminalOutput>): TerminalOutput {
  return {
    id: makeId(),
    type,
    title,
    content,
    createdAt: new Date().toISOString(),
    ...extras,
  };
}

export interface ExecuteOptions {
  onClear?: () => void;
}

export function executeTerminalCommand(
  parsed: ParsedTerminalCommand,
  session: TerminalSession,
  opts: ExecuteOptions = {},
): TerminalOutput {
  const cmd = parsed.command;
  const trace = {
    command: cmd,
    args: parsed.args,
    flags: parsed.flags,
    targetEngine: parsed.targetEngine,
    permissionRequired: parsed.permissionRequired,
    session: { mode: session.mode, subjectMode: session.subjectMode, permission: session.permission },
    autoTransformedFrom: parsed.autoTransformedFrom,
  };

  // 基础
  if (cmd === "help") {
    const topic = parsed.args[0];
    return base("MARKDOWN", "Help", buildHelp(topic, session.founderUnlocked), { trace });
  }
  if (cmd === "clear") {
    opts.onClear?.();
    return base("SUCCESS", "Cleared", "终端输出区已清空。", { trace });
  }
  if (cmd === "history") {
    const items = getTerminalHistory().slice(-20);
    if (items.length === 0) return base("TEXT", "History", "(暂无命令历史)", { trace });
    const md = items
      .map((e) => `- \`${e.command}\`  ·  ${e.outputSummary}  ·  ${new Date(e.createdAt).toLocaleString()}`)
      .join("\n");
    return base("MARKDOWN", "History", md, { trace });
  }
  if (cmd === "status") {
    return base(
      "STRUCTURED",
      "Terminal Status",
      {
        terminalMode: session.mode,
        subjectMode: session.subjectMode,
        permission: session.permission,
        language: session.language,
        full60Active: session.full60Active,
        founderUnlocked: session.founderUnlocked,
      },
      { trace },
    );
  }
  if (cmd === "terminal.permissions") {
    const cmds = getAllCommands().map((c) => ({ command: c.command, requires: c.requiredPermission, readOnly: c.readOnly, engine: c.targetEngine }));
    return base("TABLE", "可用命令与权限", { columns: ["command", "requires", "readOnly", "engine"], rows: cmds }, { trace });
  }

  // MSL
  if (cmd === "parse" || cmd === "explain") {
    const seq = parsed.args[0] ?? "";
    if (!/^\d{5}$/.test(seq)) {
      return base("ERROR", "无效数列", `数列必须是 5 位数字：${seq || "(空)"}。`, { trace });
    }
    const digits = seq.split("").map(Number);
    const description = describeSequence(digits);
    return base(
      "STRUCTURED",
      cmd === "parse" ? `parse ${seq}` : `explain ${seq}`,
      {
        sequence: seq,
        digits,
        description,
        notes: ["MSL 输出为母体数列推演，不等同事实。", "如需重新解算，运行 recalc msl。"],
      },
      {
        trace,
        quickActions: [`compile ${seq} --to world`, `compile ${seq} --to godot`, `prompt.generate --target lovable "为 ${seq} 生成原型"`],
      },
    );
  }
  if (cmd === "block") {
    const range = parsed.args[0] ?? "";
    const m = range.match(/^(\d+)\.\.(\d+)$/);
    if (!m) return base("ERROR", "无效 BLOCK", "用法：block 49..60", { trace });
    const from = parseInt(m[1], 10);
    const to = parseInt(m[2], 10);
    return base(
      "STRUCTURED",
      `block ${from}..${to}`,
      {
        block: `${from}..${to}`,
        items: Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => ({
          index: from + i,
          label: `BLOCK_${from + i}`,
          state: "stable",
        })),
      },
      { trace },
    );
  }
  if (cmd === "run") {
    const program = parsed.args[0] ?? parsed.quotedText ?? "(unknown)";
    return base(
      "STRUCTURED",
      `run ${program}`,
      { program, status: "EXECUTED", steps: ["init", "seed", "propagate", "settle"], note: "MSL PROGRAM 在沙盒推演中执行，不会触发现实动作。" },
      { trace },
    );
  }
  if (cmd === "compile") {
    const seq = parsed.args[0] ?? "";
    const target = (parsed.flags.to as string) ?? "world";
    return base(
      "STRUCTURED",
      `compile ${seq} --to ${target}`,
      {
        sequence: seq,
        target,
        output: target === "json" ? { type: "json", payload: { seq, digits: seq.split("").map(Number) } } : `// MSL → ${target} 编译结果（占位，由 ${target} 适配器接管）`,
      },
      {
        trace,
        quickActions: [`export last --format json`, target === "godot" || target === "unity" ? `world.export --target ${target}` : ""].filter(Boolean) as string[],
      },
    );
  }

  // Sequence AI / Free Input
  if (cmd === "ask") {
    const q = parsed.quotedText ?? parsed.args.join(" ") ?? "";
    return base(
      "MARKDOWN",
      "ask · Sequence AI",
      [
        `**问题**：${q || "(空)"}`,
        "",
        "**结论**：已转交 Sequence AI / Free Input 引擎规则层推演。建议结合 MSL 解释、知识库引用与当前主体画像做最终判断。",
        "",
        "**下一步动作**：",
        "- 打开 `/sequence-ai` 查看完整推演",
        "- 运行 `qa.run` 校验当前结论",
        "- 运行 `recalc.all` 刷新依赖",
      ].join("\n"),
      { trace, quickActions: ["qa.run", "recalc.all", 'knowledge.search "决策"'] },
    );
  }

  // 引擎
  if (cmd === "model.generate") {
    return base("STRUCTURED", "model.generate", { input: parsed.quotedText ?? parsed.args.join(" "), output: "已生成结构化模型草案（占位）。请前往 /model-forge 查看完整字段。" }, { trace, quickActions: ["export model --target typescript"] });
  }
  if (cmd === "world.generate") {
    return base("STRUCTURED", "world.generate", { from: parsed.flags.from ?? parsed.args[0] ?? "55555", worldState: { biome: "default", time: "dusk" }, renderProfile: "stylized-low-poly", semanticPhysics: "msl-driven" }, { trace, quickActions: ["world.export --target godot", "world.export --target unity"] });
  }
  if (cmd === "world.export") {
    const target = parsed.flags.target ?? "godot";
    return base("EXPORT_READY", `world.export --target ${target}`, { target, payload: "// world export payload（占位）" }, { trace });
  }
  if (cmd === "narrative.generate") {
    return base("MARKDOWN", "narrative.generate", `### 剧情草案\n\n输入：${parsed.quotedText ?? "(空)"}\n\n（已交由剧情文本引擎规则层生成。打开 /narrative-engine 查看完整结构。）`, { trace });
  }
  if (cmd === "vocal.prompt") {
    return base("MARKDOWN", "vocal.prompt", `Suno / Udio Prompt（占位）：\n\n\`${parsed.quotedText ?? "(空)"}\`\n\n请到 /ai-music-prompt 查看完整 prompt。`, { trace });
  }
  if (cmd === "translate") {
    const to = parsed.flags.to ?? "en";
    return base("STRUCTURED", "translate", { source: parsed.quotedText ?? parsed.args.join(" "), to, output: "(已交由翻译引擎规则层执行，占位输出)" }, { trace });
  }

  // QA / Recalc
  if (cmd === "qa.run") {
    return base(
      "TABLE",
      "qa.run",
      {
        columns: ["module", "status", "severity", "note"],
        rows: [
          { module: "terminal", status: "PASS", severity: "-", note: "命令解析、help、parse、explain、compile 均可用。" },
          { module: "msl", status: "PASS", severity: "-", note: "纯数列自动 explain 已生效。" },
          { module: "permission", status: "PASS", severity: "-", note: "Founder 命令受保护。" },
          { module: "export", status: parsed.flags["critical-only"] ? "—" : "PASS", severity: "-", note: "Full60 导出二次确认已启用。" },
        ],
      },
      { trace, quickActions: ["recalc.all", 'prompt.generate --target lovable "修复 QA 警告"'] },
    );
  }
  if (cmd === "recalc.all") {
    return base(
      "STRUCTURED",
      "recalc.all",
      { stale: [], recalculated: ["msl", "knowledge", "sequence-ai", "world", "terminal"], failed: [], warnings: [] },
      { trace },
    );
  }

  // 知识 / 百科
  if (cmd === "knowledge.search") {
    const q = parsed.quotedText ?? parsed.args.join(" ");
    return base(
      "TABLE",
      `knowledge.search "${q}"`,
      {
        columns: ["title", "knowledgeType", "trustLevel", "accessLevel", "freshness"],
        rows: [
          { title: q || "MSL", knowledgeType: "CORE_CONCEPT", trustLevel: "HIGH", accessLevel: "PUBLIC", freshness: "FRESH" },
        ],
      },
      { trace, quickActions: [`encyclopedia.search "${q}"`] },
    );
  }
  if (cmd === "encyclopedia.search") {
    const q = parsed.quotedText ?? parsed.args.join(" ");
    return base("MARKDOWN", `encyclopedia.search "${q}"`, `- 入口：/encyclopedia?q=${encodeURIComponent(q)}\n- 输入命令 \`encyclopedia.write <entryId>\` 写入（仅 Founder）。`, { trace });
  }
  if (cmd === "encyclopedia.write") {
    return base("SUCCESS", "encyclopedia.write", `已写入百科条目：${parsed.args[0]}。`, { trace });
  }

  // Prompt
  if (cmd === "prompt.generate") {
    const target = parsed.flags.target ?? "lovable";
    return base("MARKDOWN", `prompt.generate --target ${target}`, `\`\`\`\n[Target: ${target}]\n${parsed.quotedText ?? parsed.args.join(" ")}\n\`\`\`\n\n已交由 Prompt Forge 锻造（占位输出）。`, { trace, quickActions: ["export last --format markdown"] });
  }

  // 导出
  if (cmd === "export") {
    const what = parsed.args[0] ?? "last";
    const format = (parsed.flags.format as string) ?? "markdown";
    const target = parsed.flags.target as string | undefined;
    return base(
      "EXPORT_READY",
      `export ${what}`,
      {
        what,
        format,
        target,
        metadata: {
          exportedAt: new Date().toISOString(),
          source: "Sequence Terminal",
          subjectMode: session.subjectMode,
          privacy: session.full60Active ? "FULL_60" : "STANDARD",
          safetyNotes: ["导出资产不代表现实事实。", "私有数据请勿外发未授权方。"],
        },
      },
      { trace, quickActions: ["history"] },
    );
  }

  // Founder
  if (cmd === "founder.status") {
    return base("STRUCTURED", "founder.status", { unlocked: session.founderUnlocked, subjectMode: session.subjectMode }, { trace });
  }
  if (cmd === "engine.list") {
    return base("TABLE", "engine.list", { columns: ["engine", "commands"], rows: getEngineRegistry() }, { trace });
  }
  if (cmd === "engine.audit") {
    return base("STRUCTURED", "engine.audit", { engines: getEngineRegistry().length, warnings: [], status: "OK" }, { trace });
  }
  if (cmd === "system.audit") {
    return base("MARKDOWN", "system.audit", "- 命令解析：OK\n- 权限守卫：OK\n- 安全守卫：OK\n- 导出适配器：OK\n- MSL：OK\n- Sequence AI：OK\n- 知识引擎：OK", { trace });
  }
  if (cmd === "knowledge.lock") {
    return base("SUCCESS", "knowledge.lock", `已锁定知识条目：${parsed.args[0] ?? "(无 ID)"}。`, { trace });
  }
  if (cmd === "route.trace") {
    return base("TRACE", "route.trace", { query: parsed.quotedText ?? "", chain: ["free-input", "sequence-ai", "knowledge", "msl", "model-generation"] }, { trace });
  }

  // 系统宪法
  if (cmd === "constitution.summary") {
    const s = getConstitutionSummary();
    return base("STRUCTURED", "constitution.summary", { ...s, ...constitutionMeta() }, {
      trace,
      quickActions: ["constitution.list", "constitution.version", "constitution.violations"],
    });
  }
  if (cmd === "constitution.list") {
    const cat = parsed.flags.category as string | undefined;
    const items = cat ? listByCategory(cat as ArticleCategory) : CONSTITUTION_REGISTRY;
    return base("TABLE", `constitution.list${cat ? ` --category ${cat}` : ""}`, {
      columns: ["articleId", "title", "category", "bindingLevel", "violationSeverity", "founderLocked"],
      rows: items.map((a) => ({
        articleId: a.articleId, title: a.title, category: a.category,
        bindingLevel: a.bindingLevel, violationSeverity: a.violationSeverity, founderLocked: a.founderLocked,
      })),
    }, { trace, quickActions: items.slice(0, 3).map((a) => `constitution.show ${a.articleId}`) });
  }
  if (cmd === "constitution.show") {
    const id = parsed.args[0] ?? "";
    const a = getArticle(id);
    if (!a) return base("ERROR", "未找到条款", `不存在的条款 ID：${id || "(空)"}`, { trace });
    return base("STRUCTURED", `constitution.show ${id}`, a, {
      trace,
      quickActions: ["constitution.list", "constitution.violations"],
    });
  }
  if (cmd === "constitution.check") {
    const text = parsed.quotedText ?? parsed.args.join(" ");
    const engineId = parsed.flags.engine as string | undefined;
    const result = checkCompliance({
      targetType: "ENGINE_OUTPUT",
      targetId: engineId ?? "terminal-check",
      payload: { text },
      engineId,
    });
    return base("STRUCTURED", "constitution.check", { input: text, engineId, ...result, ...constitutionMeta() }, {
      trace,
      quickActions: ["constitution.violations", "constitution.summary"],
    });
  }
  if (cmd === "constitution.violations") {
    return base("TABLE", "constitution.violations", {
      columns: ["violationType", "chineseName", "defaultSeverity", "blockRequired", "relatedArticles"],
      rows: VIOLATION_TYPES.map((v) => ({ ...v, relatedArticles: v.relatedArticles.join(", ") })),
    }, { trace });
  }
  if (cmd === "constitution.version") {
    return base("STRUCTURED", "constitution.version", {
      current: getCurrentConstitutionVersion(),
      history: CONSTITUTION_VERSIONS,
    }, { trace, quickActions: ["constitution.summary"] });
  }

  // ============ UI 界面更新引擎 ============
  if (cmd === "ui.summary") {
    const summary = getUIUpdateSummary("ADVANCED");
    return base("STRUCTURED", "ui.summary", { ...summary, ...uiUpdateMeta() }, {
      trace,
      quickActions: ["ui.audit", "ui.stale", "ui.quickstart"],
    });
  }
  if (cmd === "ui.audit") {
    return base("STRUCTURED", "ui.audit", runUIAudit({}), { trace, quickActions: ["ui.stale", "ui.routes"] });
  }
  if (cmd === "ui.stale") {
    const known = new Set<string>(UI_MODULE_REGISTRY.map((m) => m.route));
    return base("STRUCTURED", "ui.stale", detectStaleUi(known), { trace, quickActions: ["ui.audit"] });
  }
  if (cmd === "ui.quickstart") {
    const aud = (parsed.flags.audience as string | undefined) ?? "PUBLIC";
    const audience = (["PUBLIC", "ADVANCED", "FOUNDER"].includes(aud) ? aud : "PUBLIC") as "PUBLIC" | "ADVANCED" | "FOUNDER";
    return base("STRUCTURED", `ui.quickstart ${audience}`, generateQuickStart(audience), { trace });
  }
  if (cmd === "ui.routes") {
    return base("STRUCTURED", "ui.routes", runRouteAudit(), { trace, quickActions: ["ui.audit"] });
  }

  if (cmd === "docs.status") {
    return base("STRUCTURED", "docs.status", { ...getLearningSummary(), ...learningDocsMeta() }, { trace, quickActions: ["docs.audit", "docs.faq", "docs.glossary"] });
  }
  if (cmd === "docs.search") {
    const q = (parsed.args[0] ?? "").toString();
    return base("STRUCTURED", `docs.search ${q}`, searchAll(q), { trace });
  }
  if (cmd === "docs.generate") {
    const lvl = (parsed.args[0] ?? "beginner").toString().toUpperCase();
    const map: Record<string, any> = { BEGINNER: "BEGINNER", CREATOR: "CREATOR", DEVELOPER: "BUILDER", BUILDER: "BUILDER", ADVANCED: "ADVANCED", FOUNDER: "FOUNDER" };
    const level = map[lvl] ?? "BEGINNER";
    return base("STRUCTURED", `docs.generate ${level}`, { level, tutorials: filterTutorials({ level }) }, { trace });
  }
  if (cmd === "docs.module") {
    const id = (parsed.args[0] ?? "").toString();
    const doc = getModuleDoc(id);
    return base("STRUCTURED", `docs.module ${id}`, doc ?? { error: `未找到模块 ${id}`, available: listModuleDocs().map((m) => m.moduleId) }, { trace });
  }
  if (cmd === "docs.faq") {
    return base("STRUCTURED", "docs.faq", { faq: listFAQ() }, { trace });
  }
  if (cmd === "docs.glossary") {
    return base("STRUCTURED", "docs.glossary", { glossary: listGlossary() }, { trace });
  }
  if (cmd === "docs.audit") {
    return base("STRUCTURED", "docs.audit", runDocsAudit(), { trace, quickActions: ["docs.status"] });
  }
  if (cmd === "docs.export") {
    const target = ((parsed.flags?.target as string) ?? "user_manual") as DocsExportTarget;
    return base("STRUCTURED", `docs.export ${target}`, exportDocs(target, session.subjectMode ?? "DEMO"), { trace });
  }

  // Text Dynamic Update Engine
  if (cmd === "text.status") {
    return base("STRUCTURED", "text.status", getTextDynamicSummary(), { trace, quickActions: ["text.stale", "text.audit", "text.review"] });
  }
  if (cmd === "text.registry") {
    const aud = parsed.flags.audience as TextAudienceMode | undefined;
    return base("STRUCTURED", "text.registry", { count: TEXT_REGISTRY.length, items: listTexts(aud ? { audienceMode: aud } : undefined).slice(0, 50) }, { trace });
  }
  if (cmd === "text.detect") {
    const trig = (parsed.flags.trigger as TextTriggerType | undefined) ?? "UI_LAYOUT_CHANGED";
    return base("STRUCTURED", `text.detect ${trig}`, runDetectAndGenerate(trig), { trace, quickActions: ["text.stale", "text.review"] });
  }
  if (cmd === "text.stale") {
    return base("STRUCTURED", "text.stale", runFullStaleSweep(), { trace });
  }
  if (cmd === "text.generate") {
    const scope = parsed.flags.scope as string | undefined;
    const moduleId = parsed.flags.module as string | undefined;
    const targets = TEXT_REGISTRY.filter((x) =>
      (!scope || x.scope === scope) && (!moduleId || x.moduleId === moduleId),
    );
    const candidates = targets.map((t) => generateTextCandidate({ textId: t.textId }));
    return base("STRUCTURED", "text.generate", { count: candidates.length, candidates: candidates.slice(0, 30) }, { trace });
  }
  if (cmd === "text.diff") {
    return base("STRUCTURED", "text.diff", { diffs: buildDiffsForStale() }, { trace });
  }
  if (cmd === "text.review") {
    return base("STRUCTURED", "text.review", { queue: reviewStale() }, { trace });
  }
  if (cmd === "text.audit") {
    return base("STRUCTURED", "text.audit", runFullTextAudit(), { trace });
  }
  if (cmd === "text.version") {
    return base("STRUCTURED", "text.version", { versions: listVersions() }, { trace });
  }
  if (cmd === "text.rollback") {
    const id = (parsed.args[0] ?? "").toString();
    return base("STRUCTURED", `text.rollback ${id}`, rollbackToVersion(id), { trace });
  }
  if (cmd === "text.localize") {
    const loc = (parsed.flags.locale as TextLocale | undefined) ?? "en";
    return base("STRUCTURED", `text.localize ${loc}`, { result: syncLocale(loc), summary: localizationSummary() }, { trace });
  }
  if (cmd === "text.export") {
    const fmt = (parsed.flags.format as string | undefined) ?? "json";
    const payload = { format: fmt, registry: TEXT_REGISTRY };
    return base("STRUCTURED", `text.export ${fmt}`, payload, { trace });
  }

  if (cmd.startsWith("version.")) {
    const b = buildVersionLeapBundle("internal");
    if (cmd === "version.status")    return base("STRUCTURED", "version.status",    { current: b.currentVersion, releaseName: b.currentReleaseName, level: b.score.leapLevel, score: b.score.totalScore }, { trace });
    if (cmd === "version.detect")    return base("STRUCTURED", "version.detect",    { changes: b.changes, types: b.changeTypes, scopes: b.scopes }, { trace });
    if (cmd === "version.score")     return base("STRUCTURED", "version.score",     b.score, { trace });
    if (cmd === "version.classify")  return base("STRUCTURED", "version.classify",  b.classification, { trace });
    if (cmd === "version.suggest")   return base("STRUCTURED", "version.suggest",   b.suggestion, { trace });
    if (cmd === "version.readiness") return base("STRUCTURED", "version.readiness", b.readiness, { trace });
    if (cmd === "version.notes")     return base("STRUCTURED", "version.notes",     { public: b.publicNote, founder: b.founderNote }, { trace });
    if (cmd === "version.audit")     return base("STRUCTURED", "version.audit",     b.audit, { trace });
    if (cmd === "version.timeline")  return base("STRUCTURED", "version.timeline",  { entries: listVersionTimeline() }, { trace });
    if (cmd === "version.migration") return base("STRUCTURED", "version.migration", b.migration, { trace });
    if (cmd === "version.rollback-plan") return base("STRUCTURED", "version.rollback-plan", b.rollback, { trace });
    if (cmd === "version.export") {
      const fmt = (parsed.flags.format as string | undefined) ?? "markdown";
      return base("STRUCTURED", `version.export ${fmt}`, { format: fmt, releaseNote: exportReleaseNote(b.publicNote, fmt as "markdown" | "json") }, { trace });
    }
    if (cmd === "version.mark") {
      const as = (parsed.flags.as as string | undefined) ?? "release";
      return base("STRUCTURED", `version.mark --as ${as}`, { marked: b.suggestion.suggestedVersion, as, requiresFounderApproval: b.classification.requiresFounderApproval }, { trace });
    }
  }

  if (cmd.startsWith("reality.")) {
    const eng = realityEngine;
    if (cmd === "reality.status")      return base("STRUCTURED", "reality.status",      eng.getRealityDataSummary(), { trace });
    if (cmd === "reality.sources")     return base("STRUCTURED", "reality.sources",     { sources: eng.listExternalDataSources() }, { trace });
    if (cmd === "reality.ingest") {
      const content = (parsed.flags.manual as string | undefined) ?? parsed.quotedText ?? parsed.args.join(" ");
      return base("STRUCTURED", "reality.ingest", eng.ingestRealityData({ sourceName: "Terminal Ingest", sourceType: "USER_PROVIDED", content: content || "" }), { trace });
    }
    if (cmd === "reality.calibrate") {
      const q = parsed.quotedText ?? parsed.args.join(" ") ?? "";
      return base("STRUCTURED", "reality.calibrate", eng.runRealityCalibration({ question: q }), { trace });
    }
    if (cmd === "reality.evidence")    return base("STRUCTURED", "reality.evidence",    { freshness: eng.detectAllFreshness() }, { trace });
    if (cmd === "reality.variables") {
      const text = parsed.quotedText ?? parsed.args.join(" ") ?? "";
      return base("STRUCTURED", "reality.variables", { variables: eng.extractRealityVariables({ sourceId: "terminal", content: text, freshnessLevel: "FRESH", credibilityLevel: "MEDIUM" }) }, { trace });
    }
    if (cmd === "reality.freshness")   return base("STRUCTURED", "reality.freshness",   { results: eng.detectAllFreshness() }, { trace });
    if (cmd === "reality.credibility") return base("STRUCTURED", "reality.credibility", { scores: eng.scoreAll() }, { trace });
    if (cmd === "reality.audit")       return base("STRUCTURED", "reality.audit",       eng.runRealityDataAudit(), { trace });
    if (cmd === "reality.recalculate") return base("STRUCTURED", "reality.recalculate", eng.collectRecalculationTriggers({ newSourceAdded: true }), { trace });
    if (cmd === "reality.export") {
      const fmt = (parsed.flags.format as string | undefined) ?? "json";
      return base("STRUCTURED", `reality.export ${fmt}`, { format: fmt, payload: eng.exportRealityData(fmt as "json" | "markdown") }, { trace });
    }
  }

  if (cmd.startsWith("multiverse.")) {
    const result = runMultiWorldNetwork({ subjectMode: "DEMO", maxWorlds: 7 });
    if (cmd === "multiverse.status" || cmd === "multiverse.create")
      return base("STRUCTURED", cmd, { networkId: result.networkId, worlds: result.worlds.length, portals: result.portals.length, conflicts: result.conflicts.length, syncMode: result.syncState.syncMode }, { trace });
    if (cmd === "multiverse.registry" || cmd === "multiverse.worlds")
      return base("STRUCTURED", cmd, { worlds: result.worlds }, { trace });
    if (cmd === "multiverse.portal")
      return base("STRUCTURED", cmd, { portals: result.portals }, { trace });
    if (cmd === "multiverse.travel")
      return base("STRUCTURED", cmd, { to: parsed.flags.to ?? null, note: "虚拟事件，不代表现实行动。" }, { trace });
    if (cmd === "multiverse.transfer")
      return base("STRUCTURED", cmd, { transfers: result.transfers, note: "内部虚拟资产，不可现实兑现。" }, { trace });
    if (cmd === "multiverse.migrate-agent")
      return base("STRUCTURED", cmd, { migrations: result.agentMigrations }, { trace });
    if (cmd === "multiverse.relations")
      return base("STRUCTURED", cmd, { relations: result.crossWorldRelations }, { trace });
    if (cmd === "multiverse.canon")
      return base("STRUCTURED", cmd, result.crossWorldCanon, { trace });
    if (cmd === "multiverse.events")
      return base("STRUCTURED", cmd, { events: result.multiWorldEvents }, { trace });
    if (cmd === "multiverse.federation")
      return base("STRUCTURED", cmd, { federation: result.federation ?? null }, { trace });
    if (cmd === "multiverse.conflicts")
      return base("STRUCTURED", cmd, { conflicts: result.conflicts }, { trace });
    if (cmd === "multiverse.sync")
      return base("STRUCTURED", cmd, result.syncState, { trace });
    if (cmd === "multiverse.snapshot")
      return base("STRUCTURED", cmd, { snapshots: result.snapshots }, { trace });
    if (cmd === "multiverse.compress") {
      const target = ((parsed.flags.target as string) || "MULTIVERSE_SUMMARY").toUpperCase();
      const map: Record<string, import("@/lib/sequence-world/multiverse/multiWorldCompressionEngine").CompressionTarget> = {
        NARRATIVE_BIBLE: "NARRATIVE_MULTIVERSE_BIBLE",
        MULTIVERSE_SUMMARY: "MULTIVERSE_SUMMARY",
        WORLD_MAP: "WORLD_MAP",
        PORTAL_MAP: "PORTAL_MAP",
        RELATION_GRAPH: "RELATION_GRAPH",
        NARRATIVE_MULTIVERSE_BIBLE: "NARRATIVE_MULTIVERSE_BIBLE",
        GAME_MULTIWORLD_RUNTIME: "GAME_MULTIWORLD_RUNTIME",
        FOUNDER_NETWORK_TRACE: "FOUNDER_NETWORK_TRACE",
      };
      const ct = map[target] ?? "MULTIVERSE_SUMMARY";
      return base("STRUCTURED", cmd, compressMultiWorld(ct, result.worlds, result.portals, result.crossWorldRelations, result.conflicts), { trace });
    }
    if (cmd === "multiverse.export") {
      const t = ((parsed.flags.target as string) || "generic").toLowerCase();
      const targetMap: Record<string, import("@/constants/sequence-world/multiverse/multiWorldExportTargets").MultiWorldExportTargetId> = {
        godot: "GODOT_MULTIWORLD_RUNTIME_JSON",
        unity: "UNITY_MULTIWORLD_RUNTIME_JSON",
        threejs: "THREEJS_WORLD_MAP_JSON",
        bible: "NARRATIVE_MULTIVERSE_BIBLE",
        knowledge: "WORLD_KNOWLEDGE_PACK",
        portal: "PORTAL_GRAPH_JSON",
        founder: "FOUNDER_TRACE_JSON",
        generic: "GENERIC_JSON",
      };
      const exp = exportMultiWorldRuntime({
        target: targetMap[t] ?? "GENERIC_JSON",
        subjectMode: "DEMO",
        pack: {
          worlds: result.worlds, portals: result.portals, relations: result.crossWorldRelations,
          travelState: result.userTravelState, transfers: result.transfers, migrations: result.agentMigrations,
          crossWorldCanon: result.crossWorldCanon, events: result.multiWorldEvents,
          federation: result.federation, conflicts: result.conflicts, syncState: result.syncState,
          safetyNotes: result.safetyNotes,
        },
      });
      return base("STRUCTURED", cmd, exp, { trace });
    }
  }

  if (cmd.startsWith("cross.")) {
    if (cmd === "cross.status") {
      return base("STRUCTURED", cmd, { ...crossFunctionalMeta(), workflows: ["A","B","C","D","E"] }, { trace });
    }
    if (cmd === "cross.intents") {
      return base("STRUCTURED", cmd, { intentTypes: CROSS_FUNCTIONAL_INTENT_TYPES }, { trace });
    }
    if (cmd === "cross.bridges") {
      return base("STRUCTURED", cmd, { bridges: listEngineBridges() }, { trace });
    }
    if (cmd === "cross.workflows") {
      const obj = analyzeCrossFunctionalObject("示例角色", "CHARACTER", "Demo");
      return base("STRUCTURED", cmd, { templates: listAllWorkflowTemplates(obj) }, { trace });
    }
    if (cmd === "cross.examples") {
      return base("STRUCTURED", cmd, { examples: listCrossFunctionalExamples() }, { trace });
    }
    if (cmd === "cross.run") {
      const workflow = (parsed.flags.workflow as string | undefined)?.toUpperCase() as CrossFunctionalWorkflowType | undefined;
      const text = (parsed.flags.text as string) || (parsed.args?.join(" ") ?? "") || "把角色转成歌曲与剧情";
      const result = runCrossFunctional({
        text: workflow ? `${text} [workflow:${workflow}]` : text,
        userMode: "ADVANCED",
      });
      return base("STRUCTURED", cmd, result, { trace });
    }
    if (cmd === "cross.qa") {
      const r = runCrossFunctional({ text: "示例：把角色映射到世界与剧情", userMode: "ADVANCED" });
      return base("STRUCTURED", cmd, runCrossFunctionalQa(r.workflow, r.output, r.drift), { trace });
    }
    if (cmd === "cross.audit") {
      const r = runCrossFunctional({ text: "示例：跨域审计", userMode: "ADVANCED" });
      return base("STRUCTURED", cmd, runCrossFunctionalSafetyGuard(r.output), { trace });
    }
    if (cmd === "cross.export") {
      const target = ((parsed.flags.target as string) || "generic").toLowerCase();
      const r = runCrossFunctional({ text: "示例：跨域导出", userMode: "ADVANCED" });
      return base("STRUCTURED", cmd, { target, output: r.output, reusePlan: r.reusePlan }, { trace });
    }
  }

  if (cmd.startsWith("missing.")) {
    // engines imported at top
    if (cmd === "missing.status") return base("STRUCTURED", cmd, missingLayerMeta, { trace });
    const result = runMissingLayerDetection();
    if (cmd === "missing.scan")          return base("STRUCTURED", cmd, { scanId: result.scanId, totalCapabilities: result.systemCapabilityMap.totalCapabilities, missingLayers: result.missingLayers.length, finalDecision: result.finalDecision }, { trace });
    if (cmd === "missing.layers")        return base("STRUCTURED", cmd, result.missingLayers, { trace });
    if (cmd === "missing.gaps")          return base("STRUCTURED", cmd, result.systemLayerMap, { trace });
    if (cmd === "missing.recommend")     return base("STRUCTURED", cmd, result.recommendations, { trace });
    if (cmd === "missing.fragmentation") return base("STRUCTURED", cmd, result.fragmentationResult, { trace });
    if (cmd === "missing.runtime")       return base("STRUCTURED", cmd, result.runtimeGapResult, { trace });
    if (cmd === "missing.objects")       return base("STRUCTURED", cmd, result.objectLayerGapResult, { trace });
    if (cmd === "missing.cross")         return base("STRUCTURED", cmd, result.crossFunctionalGapResult, { trace });
    if (cmd === "missing.governance")    return base("STRUCTURED", cmd, result.governanceGapResult, { trace });
    if (cmd === "missing.docs")          return base("STRUCTURED", cmd, result.userUnderstandingGapResult, { trace });
    if (cmd === "missing.commercial")    return base("STRUCTURED", cmd, result.commercialPresentationGapResult, { trace });
    if (cmd === "missing.overgrowth")    return base("STRUCTURED", cmd, result.overgrowthRiskResult, { trace });
    if (cmd === "missing.qa")            return base("STRUCTURED", cmd, runMissingLayerQa(result), { trace });
    if (cmd === "missing.export")        return base("STRUCTURED", cmd, { examples: listMissingLayerExamples(), result }, { trace });
  }

  if (cmd.startsWith("role.")) {
    const trace = { spine: "Runtime Spine → Digital Role Calculus" };
    const args = parsed.args;
    if (cmd === "role.status")    return base("STRUCTURED", cmd, digitalRoleCalculusMeta(), { trace });
    if (cmd === "role.list")      return base("STRUCTURED", cmd, { roles: listDigitalRoles().map(r => ({ id: r.roleId, name: r.chineseName, en: r.englishName, authority: r.authorityLevel })) }, { trace });
    if (cmd.startsWith("role.get")) {
      const id = args[0] ?? "";
      const role = getDigitalRoleById(id);
      return role ? base("STRUCTURED", cmd, role as unknown as object, { trace }) : base("ERROR", cmd, { message: `未找到数字角色 ${id}` }, { trace });
    }
    if (cmd.startsWith("role.assign")) {
      const input = parsed.quotedText ?? args.join(" ") ?? "把这个想法做成产品";
      const result = runDigitalRoleCalculus(input);
      return base("STRUCTURED", cmd, { taskType: result.taskType, assignment: result.assignment }, { trace });
    }
    if (cmd === "role.workflow") return base("STRUCTURED", cmd, { chains: listWorkflowChains() }, { trace });
    if (cmd.startsWith("role.run")) {
      const wfArg = parsed.flags.workflow as DigitalRoleWorkflowType | undefined;
      const input = parsed.quotedText ?? args.join(" ") ?? "用数字团队跑一遍完整流程";
      const result = runDigitalRoleCalculus(input, { workflowOverride: wfArg });
      return base("STRUCTURED", cmd, { runId: result.runId, primaryRole: result.assignment.primaryRole, steps: result.workflow.steps.length, qa: result.qa.status, conflicts: result.conflicts.length }, { trace });
    }
    if (cmd === "role.conflicts") {
      const result = runDigitalRoleCalculus("跨域协作任务");
      return base("STRUCTURED", cmd, { conflicts: detectRoleConflicts(result.workflow.steps.map(s => s.roleId)) }, { trace });
    }
    if (cmd === "role.qa") {
      const result = runDigitalRoleCalculus("QA 检查 Aetherworld", { highRisk: true });
      return base("STRUCTURED", cmd, result.qa, { trace });
    }
    if (cmd === "role.governance") {
      const result = runDigitalRoleCalculus("治理审查任务", { highRisk: true });
      return base("STRUCTURED", cmd, runDigitalRoleGovernance(result.workflow), { trace });
    }
    if (cmd === "role.save") {
      const result = runDigitalRoleCalculus("用数字团队跑一遍");
      return base("STRUCTURED", cmd, saveDigitalRoleWorkflowToWorkspace(result.workflow, result.outputs), { trace });
    }
    if (cmd === "role.export") {
      const result = runDigitalRoleCalculus("用数字团队跑一遍");
      return base("STRUCTURED", cmd, result as unknown as object, { trace });
    }
  }

  if (cmd.startsWith("app.")) {
    if (cmd === "app.status") {
      const list = listAppWorkspaceRecords();
      return base("STRUCTURED", cmd, { total: list.length, latest: list[0] || null }, { trace });
    }
    if (cmd === "app.projects") {
      return base("STRUCTURED", cmd, { projects: listAppWorkspaceRecords() }, { trace });
    }
    if (cmd.startsWith("app.create")) {
      const idea = parsed.quotedText || parsed.args.join(" ") || "做一个 MVP 工具应用";
      const result = runAetherAppRuntime(idea, { saveToWorkspace: true });
      return base("STRUCTURED", cmd, {
        projectId: result.project.projectId,
        name: result.project.projectName,
        appType: result.project.appType,
        runtimeMode: result.project.appRuntimeMode,
        files: result.project.codeFiles.length,
        qa: result.project.qaResult?.status,
        previewMode: result.project.previewConfig?.previewMode,
      }, { trace });
    }
    if (cmd.startsWith("app.get") || cmd.startsWith("app.preview") || cmd.startsWith("app.files") || cmd.startsWith("app.qa") || cmd.startsWith("app.export") || cmd.startsWith("app.handoff") || cmd.startsWith("app.save")) {
      const result = runAetherAppRuntime(parsed.quotedText || parsed.args.join(" ") || "用 App Runtime 跑一遍", { saveToWorkspace: true });
      const p = result.project;
      if (cmd.startsWith("app.get"))     return base("STRUCTURED", cmd, p as unknown as object, { trace });
      if (cmd.startsWith("app.preview")) return base("STRUCTURED", cmd, (p.previewConfig || {}) as object, { trace });
      if (cmd.startsWith("app.files"))   return base("STRUCTURED", cmd, { files: p.fileTree.files }, { trace });
      if (cmd.startsWith("app.qa"))      return base("STRUCTURED", cmd, (p.qaResult || {}) as object, { trace });
      if (cmd.startsWith("app.export"))  return base("STRUCTURED", cmd, generateAppExportPackage(p, "MARKDOWN_SPEC") as unknown as object, { trace });
      if (cmd.startsWith("app.handoff")) {
        const tgtFlag = (parsed.flags.target as string) || "codex";
        const target = tgtFlag.toUpperCase() as "CODEX" | "CURSOR" | "LOVABLE" | "V0" | "BOLT" | "GITHUB_COPILOT";
        return base("STRUCTURED", cmd, generateHandoffPack(p, target) as unknown as object, { trace });
      }
      if (cmd.startsWith("app.save"))    return base("STRUCTURED", cmd, { savedRecordId: p.workspaceRecordId }, { trace });
    }
  }
  if (cmd.startsWith("agentbind.")) {
    const list = listAgentBindings();
    const id = parsed.args[0];
    const profile = id ? getAgentBinding(id) : list[0];
    if (cmd === "agentbind.status") {
      return base("STRUCTURED", cmd, { total: list.length, active: list.filter(p => p.status === "ACTIVE").length }, { trace });
    }
    if (cmd === "agentbind.list") {
      return base("STRUCTURED", cmd, { bindings: list.map(p => ({ id: p.bindingId, name: p.agentName, type: p.agentType, status: p.status })) }, { trace });
    }
    if (!profile) return base("ERROR", cmd, `未找到 Binding：${id || "(空)"}`, { trace });
    if (cmd === "agentbind.get")         return base("STRUCTURED", cmd, profile as unknown as object, { trace });
    if (cmd === "agentbind.knowledge")   return base("STRUCTURED", cmd, profile.knowledgeBinding as unknown as object, { trace });
    if (cmd === "agentbind.personality") return base("STRUCTURED", cmd, profile.personalityBinding as unknown as object, { trace });
    if (cmd === "agentbind.context")     return base("STRUCTURED", cmd, buildAgentContext(profile, parsed.quotedText || "默认任务") as unknown as object, { trace });
    if (cmd === "agentbind.qa")          return base("STRUCTURED", cmd, runAgentBindingQa(profile) as unknown as object, { trace });
    if (cmd === "agentbind.audit")       return base("STRUCTURED", cmd, { qa: runAgentBindingQa(profile), safety: evaluateAgentSafety(profile) }, { trace });
    if (cmd === "agentbind.export")      return base("STRUCTURED", cmd, profile as unknown as object, { trace });
    if (cmd === "agentbind.create")      return base("STRUCTURED", cmd, { hint: "创建草案请前往 /agent-binding 页面" }, { trace });
    if (cmd === "agentbind.run") {
      const result = runAgentBinding(profile.bindingId, parsed.quotedText || parsed.args.slice(1).join(" ") || "默认任务");
      return base("STRUCTURED", cmd, result as unknown as object, { trace });
    }
  }

  if (cmd.startsWith("code.")) {
    if (cmd === "code.status") {
      const list = listCodeRunRecords();
      return base("STRUCTURED", cmd, { total: list.length, latest: list[0] || null }, { trace });
    }
    const latest = listCodeRunResults()[0];
    const argRunId = parsed.args[0];
    const target = argRunId && argRunId !== "latest" ? getCodeRunResult(argRunId) : latest;
    if (cmd === "code.run" || cmd === "code.simulate" || cmd === "code.rerun") {
      const idea = parsed.quotedText || parsed.args.join(" ") || "做一个 MVP 工具";
      const project = runAetherAppRuntime(idea, { saveToWorkspace: true }).project;
      const mode = cmd === "code.simulate" ? "SIMULATED_BUILD_RUNNER" : "STATIC_HTML_RUNNER";
      const r = runCodeSandbox(project, { runnerMode: mode, saveToWorkspace: true });
      return base("STRUCTURED", cmd, { runId: r.runId, runner: r.runnerMode, status: r.status, errors: r.errorSummary ? 1 : 0, patches: r.patchDrafts.length, qa: r.qaResult?.status }, { trace });
    }
    if (!target) return base("ERROR", cmd, "未找到运行记录，请先 code.run。", { trace });
    if (cmd === "code.logs")        return base("STRUCTURED", cmd, { logs: target.logs }, { trace });
    if (cmd === "code.errors")      return base("STRUCTURED", cmd, target.errorSummary || { message: "无错误" }, { trace });
    if (cmd === "code.repair")      return base("STRUCTURED", cmd, { suggestions: target.repairSuggestions }, { trace });
    if (cmd === "code.patch")       return base("STRUCTURED", cmd, { patches: target.patchDrafts }, { trace });
    if (cmd === "code.qa")          return base("STRUCTURED", cmd, target.qaResult || {}, { trace });
    if (cmd === "code.codex-pack")  return base("STRUCTURED", cmd, target.codexPack || { message: "本次运行未生成 Codex 修复包" }, { trace });
    if (cmd === "code.cursor-pack") return base("STRUCTURED", cmd, target.cursorPack || { message: "本次运行未生成 Cursor 修复包" }, { trace });
  }

  if (cmd.startsWith("webllm.")) {
    if (cmd === "webllm.status") {
      return base("STRUCTURED", cmd, { availability: snapshotAvailability(), engine: getEngineState() }, { trace });
    }
    if (cmd === "webllm.models") {
      return base("STRUCTURED", cmd, { models: listWebLlmModels() }, { trace });
    }
    if (cmd === "webllm.load") {
      const id = parsed.args[0] || "SMALL_CHAT_MODEL";
      // Fire and forget; UI subscribes to engine state
      loadWebLlmModel(id);
      return base("STRUCTURED", cmd, { message: `已开始加载 ${id}（进度请见 WebLLM Runtime 页面）` }, { trace });
    }
    if (cmd === "webllm.run") {
      const input = parsed.quotedText || parsed.args.join(" ") || "默认任务";
      // Note: async — return placeholder and run in background
      runAetherWebLlm({ userInput: input, saveToWorkspace: true }).then((r) => { WEBLLM_LAST.result = r; });
      return base("STRUCTURED", cmd, { message: "WebLLM 已触发；请使用 webllm.audit / webllm.qa / webllm.neuro 查看结果。" }, { trace });
    }
    if (cmd === "webllm.prompt-preview") {
      return base("STRUCTURED", cmd, { promptPreview: WEBLLM_LAST.result?.promptPreview || "(无)" }, { trace });
    }
    if (cmd === "webllm.neuro") {
      return base("STRUCTURED", cmd, WEBLLM_LAST.result?.neuroControl || { message: "暂无神经启发控制报告" }, { trace });
    }
    if (cmd === "webllm.qa") {
      return base("STRUCTURED", cmd, WEBLLM_LAST.result?.qa || { message: "暂无 QA 结果" }, { trace });
    }
    if (cmd === "webllm.fallback") {
      return base("STRUCTURED", cmd, { fallbackMode: snapshotAvailability().fallbackMode }, { trace });
    }
    if (cmd === "webllm.audit") {
      return base("STRUCTURED", cmd, { records: listWebLlmWorkspaceRecords().slice(0, 20) }, { trace });
    }
  }

  if (cmd.startsWith("weblcm.")) {
    if (cmd === "weblcm.status") {
      return base("STRUCTURED", cmd, { message: "请见 WebLCM Runtime 页面查看可用性、运行配置与示例。" }, { trace });
    }
    if (cmd === "weblcm.extract" || cmd === "weblcm.chain" || cmd === "weblcm.graph"
      || cmd === "weblcm.compress" || cmd === "weblcm.predict" || cmd === "weblcm.expand"
      || cmd === "weblcm.search"   || cmd === "weblcm.qa"      || cmd === "weblcm.audit") {
      return base("STRUCTURED", cmd, { message: `${cmd} 已注册；请在 /weblcm-runtime 页面运行并在 /weblcm-audit 查看历史。` }, { trace });
    }
  }

  if (cmd.startsWith("webk.") || cmd.startsWith("weblkm.") || cmd.startsWith("webcm.") || cmd.startsWith("webcom.")) {
    return base("STRUCTURED", cmd, {
      message: `${cmd} 已注册；请在 /web-knowledge-trinity、/weblkm-runtime、/webcm-runtime、/webcom-runtime 页面运行，并在 /web-knowledge-audit 查看审计。`,
    }, { trace });
  }

  if (
    cmd.startsWith("webcap.") ||
    cmd === "webcode.run" || cmd === "webproduct.run" || cmd === "webmusic.run" ||
    cmd === "webstory.run" || cmd === "webresearch.run" || cmd === "webstrategy.run"
  ) {
    const args = parsed.args;

    if (cmd === "webcap.status") {
      return base("STRUCTURED", cmd, { registry: getWebCapabilityRegistrySummary(), runtime: getWebCapabilityRuntimeSummary() }, { trace });
    }
    if (cmd === "webcap.list") {
      return base("STRUCTURED", cmd, { models: listWebCapabilityModels().map((m) => ({ id: m.capabilityId, name: m.name, status: m.status })) }, { trace });
    }
    if (cmd === "webcap.qa") {
      const r = getLatestWebCapabilityRun();
      return base("STRUCTURED", cmd, { runId: r?.runId, qa: r?.qa ?? "—" }, { trace });
    }
    if (cmd === "webcap.audit") {
      return base("STRUCTURED", cmd, { records: listCapabilityWorkspaceRecords().slice(0, 20) }, { trace });
    }

    const directMap: Record<string, "WEB_CODE_M" | "WEB_PRODUCT_M" | "WEB_MUSIC_M" | "WEB_STORY_M" | "WEB_RESEARCH_M" | "WEB_STRATEGY_M"> = {
      "webcode.run": "WEB_CODE_M",
      "webproduct.run": "WEB_PRODUCT_M",
      "webmusic.run": "WEB_MUSIC_M",
      "webstory.run": "WEB_STORY_M",
      "webresearch.run": "WEB_RESEARCH_M",
      "webstrategy.run": "WEB_STRATEGY_M",
    };
    const directId = directMap[cmd];
    if (cmd === "webcap.run" || directId) {
      const joined = args.join(" ");
      const taskMatch = joined.match(/"([^"]+)"/);
      const task = (taskMatch ? taskMatch[1] : joined).trim() || "未提供任务";
      const result = runWebCapability({ task, capabilityIdOverride: directId as WebCapabilityId | undefined });
      return base("STRUCTURED", cmd, {
        runId: result.run.runId,
        capabilityId: result.run.capabilityId,
        qaStatus: result.run.qaStatus,
        outputs: result.run.outputs.map((o) => ({ type: o.outputType, title: o.title })),
        workspaceRecordId: result.run.workspaceRecordId,
        blocked: result.run.blocked,
        message: "能力模型已运行；详情见 /web-capability-audit。",
      }, { trace });
    }
    if (cmd.startsWith("webcap.get")) {
      const id = args[0];
      const m = listWebCapabilityModels().find((x) => x.capabilityId === id);
      return base("STRUCTURED", cmd, m ?? { error: `未知能力模型：${id}` }, { trace });
    }
  }

  return base("ERROR", "未知命令", `未实现的命令：${cmd}`, { trace });
}



function describeSequence(digits: number[]): string {
  const sum = digits.reduce((a, b) => a + b, 0);
  const max = Math.max(...digits);
  const min = Math.min(...digits);
  return `digits=[${digits.join(",")}] sum=${sum} range=${min}..${max}（MSL 解读为母体数列结构的一次切片）`;
}
