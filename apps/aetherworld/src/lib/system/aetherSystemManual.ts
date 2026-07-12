// Aetherworld 总说明书 v0.1（System Manual）
// 用作项目内部宪法 / 架构总览 / 开发索引 / 继续开发上下文基准。
// 仅作展示数据，不参与生产链路。

export interface ManualSection {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  code?: string;
}

export const MANUAL_VERSION = "v0.1";
export const MANUAL_UPDATED_AT = "2026-05-25";

export const MANUAL_HEADLINE =
  "Aetherworld 是一个以对话为入口的数列元智能平台。它通过本地模型、跨域融合、计算法链、数列记忆、数列货币、MSL 状态语言、预测、调度、工作区、能力商店、社交与世界引擎，构成一个可生成、可记录、可预测、可调度、可自我审计的智能操作系统雏形。";

export const MAIN_PIPELINE_CODE = `用户输入
  → Secret Guard
  → Sequence Memory Retriever
  → WebLCM 概念抽取
  → 五域坐标 (FiveDomainCoordinate)
  → 计算法链 (CalculusChain)
  → Engine Weight Resolver
  → Constants Universe
  → LLM Provider / Ollama
  → ChatDisplayResult
  → Workspace / Scheduler / Calendar / Store / Social
  → MSL 状态帧
  → Sequence Currency / Value Ledger
  → Sequence Memory
  → Analytics / Bug Audit / 回验中心`;

export const MANUAL_SECTIONS: ManualSection[] = [
  {
    id: "definition",
    title: "1. 项目总定义 · Aetherworld 是什么",
    paragraphs: [
      "Aetherworld 是一个以 Chat 为唯一主入口的数列元智能平台，目标是把对话、生成、预测、调度、记忆、价值、世界与社交统一在一个可审计的运行时之上。",
    ],
    bullets: [
      "数列元智能平台：所有对象、行为与状态都以「数列」表达。",
      "对话式操作系统：Chat 即调度中心，而非聊天玩具。",
      "本地模型工作台：优先接入本机 Ollama，云端模型作为补位。",
      "能力商店：能力包 / 模型包 / 工具包统一上架与计量。",
      "世界引擎：虚拟生活 OS、虚拟世界 OS、文明编年与事件算法。",
      "应用生成与代码运行：App Runtime、Code Sandbox、Patch 草案。",
      "预测、调度、记录、回验、自进化：闭环增长内核。",
    ],
  },
  {
    id: "entries",
    title: "2. 当前核心入口",
    bullets: [
      "Chat：所有问题与任务的入口（/chat）。",
      "首页：主控台（/，保持极简）。",
      "商店：能力包 / 模型包 / 工具包（/store）。",
      "工作区：对象与项目（/canvas-workspace, /workspace 系列）。",
      "日历：触发与复查（/calendar, /calendar/triggers）。",
      "社交：作品与对象流通（/social）。",
      "系统：QA / 审计 / 设置 / 说明书（/system, /system-bug-audit, /system/manual）。",
      "模型提供者：Ollama / WebLLM / Local Gateway（/llm-providers）。",
    ],
  },
  {
    id: "pipeline",
    title: "3. 系统主链路",
    paragraphs: [
      "一次 Chat 请求会贯穿安全、记忆、概念、计算法、权重、常数、模型、结果承接、状态、价值与审计十一层，任何一层失败都应有降级路径。",
    ],
    code: MAIN_PIPELINE_CODE,
  },
  {
    id: "layers",
    title: "4. 核心系统层说明",
    bullets: [
      "A. Chat 主入口：唯一对话面板，承接所有模块结果卡（ANSWER / PREDICTION / SCHEDULER / LEGACY / AGENT / SEQUENCE_AI 等）；下一步：流式打断与上下文压缩可视化。",
      "B. LLM Provider / Ollama：本机 Ollama（qwen3:8b 等）为主链路，WebLLM 与 Lovable AI 为补位；Provider Test 已通；下一步：Local Gateway 真实派发与多模型并发。",
      "C. Cross-Domain Fusion Runtime：ENGINE_WEIGHT_CONSTANTS + 五域坐标 + 计算法链 + 常数宇宙 + WebLCM 概念图 + ChatFusionInfoPanel；保证「同一问题在不同域内的解释一致」。",
      "D. Sequence Memory：SMU（Sequence Memory Unit）、历史压缩、Top-K 注入、安全过滤；让模型在长会话中保持稳定上下文且不泄漏敏感数据。",
      "E. Sequence Currency / Value Ledger：模型调用、工具调用、对象创建的统一价值账本；非金融资产，不可兑换法币。",
      "F. MSL State Language：CHAT_TURN / FUSION_PLAN / TOOL_CALL / WORKSPACE / STORE / CALENDAR / SOCIAL 等系统状态帧，用作跨模块审计与回放。",
      "G. Sequence Prediction Engine：当前状态数列化 → 七类变量提取 → ≥3 条轨迹 → 概率区间 → 行动许可 → 复查节点；不做确定性承诺、不做金融指令。",
      "H. Scheduler Runtime：AetherTask + 状态机 + ExecutionPlan + 高风险 WAITING_CONFIRMATION；统一编排 Chat / Calendar / Workspace / Code / App / Social / QA。",
      "I. Legacy Module Registry：扫描 + 登记 + Activation Map + Bridge Plan，覆盖虚拟生活 OS / 虚拟世界 OS / 产品自进化 / 记录中心 / 回验中心 / 记录权重 等历史模块。",
      "J. Analytics Runtime：模型 / 融合 / 记忆 / 价值 / 调度 / 预测 / 旧模块统计；为产品自进化提供输入信号。",
      "K. Sequence Agent Runtime：架构 / 产品 / 代码 / QA / 安全 / 预测 / 记忆 / 世界 / 调度 / 分析共 10 位系统 Agent + Coordinator 多 Agent 评审。",
      "L. Sequence AI Runtime：数列 AI 总调度内核（EXPLAIN / GENERATE / PREDICT / COMPRESS / VALUE / AGENT / STATE / WORLD 八种模式），编排上述全部子系统。",
    ],
  },
  {
    id: "objects",
    title: "5. 关键对象类型",
    bullets: [
      "ChatDisplayResult — 所有模块向 Chat 返回结果的统一承接结构。",
      "WorkspaceObject — 工作区对象（项目、文档、原型、数列等）。",
      "SequenceMemoryUnit (SMU) — 数列记忆压缩最小单元。",
      "SequenceCurrencyEvent — 价值账本事件（模型 / 工具 / 对象计量）。",
      "MSLStateFrame — 数列状态语言帧（系统级状态快照）。",
      "SequencePredictionResult — 当前状态、变量、轨迹、概率、复查节点。",
      "AetherTask — Scheduler 任务统一结构（含 ExecutionPlan、状态机、风险等级）。",
      "LegacyModule — 旧模块登记结构（category / layer / status / bridgePlan）。",
      "AnalyticsMetric — 统计指标（模型 / 价值 / 调度 / 预测 / 旧模块）。",
      "SequenceAgent — 数列 Agent 定义（角色、职责、权限、允许工具）。",
      "SequenceAiExecutionPlan — Sequence AI 总调度执行计划。",
      "WebLcmConceptGraph — WebLCM 概念图节点 / 边结构。",
      "FiveDomainCoordinate — 五域坐标。",
      "CalculusChain — 计算法链。",
      "EngineWeightProfile — 引擎权重档案。",
    ],
  },
  {
    id: "status",
    title: "6. 当前完成状态",
    paragraphs: ["以下分为「已完成」「已接入 / 部分接入」「待真实化」三组。"],
    bullets: [
      "✅ 已完成：Responsive Shell v1、Ollama Provider 测试、Chat 主链路接 Ollama、Fusion Runtime v0.1、Sequence Memory Compression v0.1、Bug Audit、P0 安全边界、Secret Guard、Social Publish Guard、Model Context Sanitizer。",
      "🟡 已接入 / 部分接入：Sequence Currency Integration、MSL State Language、Sequence Prediction Engine、Scheduler Runtime、Analytics Runtime、Sequence Agent Runtime、Sequence AI Runtime、Legacy Module Registry。",
      "⏳ 待真实化：Local Gateway、云端后端 / RLS、Workspace 云同步、社交真实后端、多用户、长期回验、产品自进化自动闭环。",
    ],
  },
  {
    id: "safety",
    title: "7. 安全边界",
    bullets: [
      "不泄漏 API Key / Token / Secret（统一经 modelContextSanitizer 过滤）。",
      "不保存 Full60 原始数列到普通上下文。",
      "不公开 Founder-only 内容。",
      "不自动公开发布（社交需用户确认）。",
      "不自动支付。",
      "不自动部署。",
      "不执行任意 shell。",
      "高风险动作必须用户确认（WAITING_CONFIRMATION）。",
      "预测不是确定事实，仅为概率区间与行动许可。",
      "数列货币不是法币、证券、代币或金融资产。",
    ],
  },
  {
    id: "principles",
    title: "8. 当前开发原则",
    bullets: [
      "所有新模块必须接入 Registry（Legacy / Agent / Capability）。",
      "所有任务必须能进入 Scheduler。",
      "所有状态必须能写入 MSL。",
      "所有价值消耗必须进入 Sequence Currency / Value Ledger。",
      "所有长期上下文必须进入 Sequence Memory。",
      "所有风险必须进入 QA / Bug Audit。",
      "所有旧模块必须先登记再激活。",
      "不新增复杂首页。",
      "高级信息默认折叠。",
      "不让功能散落成页面迷宫。",
    ],
  },
  {
    id: "roadmap",
    title: "9. 下一轮路线图",
    bullets: [
      "P0：总说明书、Sequence Currency Integration、MSL State Language、Sequence Prediction、Scheduler Runtime、Analytics Runtime、Legacy Module Registry。",
      "P1：Sequence Agent Runtime、Sequence AI Runtime、记录中心、回验中心、记录权重、产品自进化。",
      "P2：虚拟生活 OS、虚拟世界 OS、事件算法、虚拟日记、虚拟创造。",
      "P3：多用户生态、商店交易、社交扩散、插件生态、外部数据接入。",
    ],
  },
  {
    id: "handoff",
    title: "10. 开发者接续说明",
    paragraphs: [
      "写给未来继续开发的人 / AI：在动手前，请按以下顺序通读关键文档与审计页。",
    ],
    bullets: [
      "1) 先读本总说明书（/system/manual）。",
      "2) 再看 Bug Audit（/system-bug-audit）。",
      "3) 再看 Analytics（统计中心）。",
      "4) 再看 Legacy Module Registry（/system/legacy-modules）。",
      "5) 再看 Scheduler（/scheduler）。",
      "6) 不要绕过安全层（Secret Guard / Sanitizer / Permission Guard）。",
      "7) 不要重复造已有系统（先扫描 Registry）。",
      "8) 每轮必须写入：MSL 状态帧 + Sequence Memory + Sequence Currency + Bug Audit。",
    ],
  },
];

// ============================================================
// 开发接续摘要：可一键复制给下一次 Lovable / ChatGPT / Codex
// ============================================================
export function buildHandoffSummary(): string {
  const lines: string[] = [];
  lines.push(`# Aetherworld 当前状态（总说明书 ${MANUAL_VERSION} · ${MANUAL_UPDATED_AT}）`);
  lines.push("");
  lines.push("## 已完成");
  lines.push("- Chat 主入口 + Ollama Provider 主链路");
  lines.push("- Cross-Domain Fusion Runtime v0.1（五域 / 计算法链 / 常数 / WebLCM）");
  lines.push("- Sequence Memory Compression v0.1");
  lines.push("- Responsive Shell v1 / Secret Guard / Sanitizer / Bug Audit");
  lines.push("");
  lines.push("## 正在接入");
  lines.push("- Sequence Currency / Value Ledger");
  lines.push("- MSL State Language");
  lines.push("- Sequence Prediction Engine");
  lines.push("- Scheduler Runtime / Analytics Runtime");
  lines.push("- Sequence Agent Runtime / Sequence AI Runtime");
  lines.push("- Legacy Module Registry & Activation Map");
  lines.push("");
  lines.push("## 待接入");
  lines.push("- 记录中心 / 回验中心 / 记录权重 实际桥接");
  lines.push("- 产品自进化自动闭环");
  lines.push("- 虚拟生活 OS / 虚拟世界 OS / 事件算法 深度激活");
  lines.push("- Workspace 云同步 / 社交真实后端 / 多用户 / 长期回验");
  lines.push("- Local Gateway 真实派发");
  lines.push("");
  lines.push("## 安全边界");
  lines.push("- 不泄漏 Key / Token / Full60 原文 / Founder-only 内容");
  lines.push("- 不自动发布 / 支付 / 部署 / 执行 shell");
  lines.push("- 高风险动作 WAITING_CONFIRMATION");
  lines.push("- 预测非确定事实；数列货币非金融资产");
  lines.push("");
  lines.push("## 下一轮建议");
  lines.push("- P0：把 Legacy Bridge Plan 中的「记录中心 / 回验中心 / 记录权重」落地，并打通产品自进化闭环。");
  lines.push("- P1：Sequence Agent 私有长期记忆 + 多 Agent 自动协作评分。");
  lines.push("- 持续维护：所有新模块必须接入 Registry / Scheduler / MSL / Currency / Memory / Bug Audit。");
  return lines.join("\n");
}

export function buildSystemOverview(): string {
  const lines: string[] = [];
  lines.push(`Aetherworld 总览（${MANUAL_VERSION}）`);
  lines.push("");
  lines.push(MANUAL_HEADLINE);
  lines.push("");
  lines.push("主链路：");
  lines.push(MAIN_PIPELINE_CODE);
  lines.push("");
  lines.push("核心层：Chat / LLM Provider / Fusion / Sequence Memory / Sequence Currency / MSL / Prediction / Scheduler / Legacy Registry / Analytics / Sequence Agent / Sequence AI。");
  return lines.join("\n");
}

// ============================================================
// Chat 桥接：识别用户对总说明书的查询意图
// ============================================================
export interface ChatManualInfo {
  question: string;
  matched: string[];      // 命中的章节 id
  summary: string;        // 简要摘要
  bullets: string[];      // 简短要点
  route: string;          // 引导路由
}

const MANUAL_KEYWORDS =
  /(总说明书|说明书|系统总览|架构总览|系统手册|system\s*manual|当前.*模块|完成了哪些|下一步.*做什么|还没接|哪些模块|aetherworld.*是什么|数列记忆是什么|msl.*是什么|数列货币是什么|sequence\s*ai.*是什么)/i;

export function detectManualIntent(rawInput: string): boolean {
  if (!rawInput) return false;
  return MANUAL_KEYWORDS.test(rawInput);
}

export function buildChatManualInfo(rawInput: string): ChatManualInfo | undefined {
  if (!detectManualIntent(rawInput)) return undefined;
  const t = (rawInput || "").toLowerCase();

  const matched: string[] = [];
  const bullets: string[] = [];
  let summary = "已为你定位 Aetherworld 总说明书相关章节。";

  if (/数列记忆|memory/.test(t)) {
    matched.push("layers");
    bullets.push("数列记忆 (D)：SMU 压缩 + 历史 Top-K 注入 + 安全过滤，让长会话保持上下文且不泄敏。");
  }
  if (/msl|状态语言/.test(t)) {
    matched.push("layers");
    bullets.push("MSL 状态语言 (F)：跨模块统一状态帧（CHAT_TURN / FUSION_PLAN / TOOL_CALL 等），用作审计与回放。");
  }
  if (/数列货币|价值账本|currency|ledger/.test(t)) {
    matched.push("layers");
    bullets.push("数列货币 (E)：模型 / 工具 / 对象统一计量；非法币、非金融资产。");
  }
  if (/sequence\s*ai|数列\s*ai|总调度/.test(t)) {
    matched.push("layers");
    bullets.push("Sequence AI (L)：数列 AI 总调度内核，编排 EXPLAIN / GENERATE / PREDICT / COMPRESS / VALUE / AGENT / STATE / WORLD 八种模式。");
  }
  if (/完成了哪些|当前.*模块|哪些模块/.test(t)) {
    matched.push("status");
    bullets.push("当前状态：见第 6 节「当前完成状态」（已完成 / 部分接入 / 待真实化）。");
  }
  if (/下一步|路线图|roadmap|还没接/.test(t)) {
    matched.push("roadmap");
    bullets.push("下一轮路线图：P0 记录中心 / 回验中心 / 记录权重；P1 数列 Agent 长期记忆；P2 虚拟生活 / 虚拟世界 OS。");
  }
  if (matched.length === 0) {
    matched.push("definition", "pipeline", "layers");
    bullets.push("Aetherworld 是以 Chat 为入口的数列元智能平台（见第 1、3、4 节）。");
    bullets.push("主链路：输入 → 安全 → 记忆 → 概念 → 计算法 → 模型 → 结果 → 状态 → 价值 → 审计。");
    summary = "已为你定位 Aetherworld 总说明书首节摘要。";
  }

  return {
    question: rawInput,
    matched: Array.from(new Set(matched)),
    summary,
    bullets,
    route: "/system/manual",
  };
}
