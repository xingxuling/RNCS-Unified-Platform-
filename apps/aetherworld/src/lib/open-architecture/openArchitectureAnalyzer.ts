// 开源架构吸收 · Scanner + Analyzer + Concept Extractor + Capability Mapper + Risk Analyzer
// 这是一个纯文本启发式分析器：不执行任何外部代码，不拉取仓库，不安装依赖。
// 仅从用户粘贴的 README / 文件树 / 描述 / 代码片段中抽取信号。

import type {
  OpenArchitectureSource,
  OpenArchitectureModule,
  OpenArchitectureCapability,
  OpenArchitectureModuleLayer,
  OpenArchitectureCapabilityType,
} from "./openArchitectureTypes";

export interface ScanSignals {
  techStack: string[];
  architecturePattern: string[];
  dependencies: string[];
  languageHints: string[];
}

interface SignalRule {
  test: RegExp;
  push: (s: ScanSignals) => void;
}

const TECH_RULES: SignalRule[] = [
  { test: /\b(react|jsx|tsx)\b/i, push: (s) => s.techStack.push("React") },
  { test: /\b(vue|nuxt)\b/i, push: (s) => s.techStack.push("Vue") },
  { test: /\b(svelte|sveltekit)\b/i, push: (s) => s.techStack.push("Svelte") },
  { test: /\b(next\.?js|nextjs)\b/i, push: (s) => s.techStack.push("Next.js") },
  { test: /\btanstack\b/i, push: (s) => s.techStack.push("TanStack") },
  { test: /\b(node|express|fastify|nest)\b/i, push: (s) => s.techStack.push("Node 服务端") },
  { test: /\bpython\b/i, push: (s) => s.techStack.push("Python") },
  { test: /\brust\b/i, push: (s) => s.techStack.push("Rust") },
  { test: /\bgo(lang)?\b/i, push: (s) => s.techStack.push("Go") },
  { test: /\b(typescript|ts)\b/i, push: (s) => s.languageHints.push("TypeScript") },
  { test: /\b(javascript|js)\b/i, push: (s) => s.languageHints.push("JavaScript") },
  { test: /\b(postgres|sqlite|mysql|supabase|prisma|drizzle)\b/i, push: (s) => s.techStack.push("数据库 / ORM") },
  { test: /\b(redis|kafka|rabbitmq)\b/i, push: (s) => s.techStack.push("消息 / 队列") },
  { test: /\b(docker|kubernetes|k8s)\b/i, push: (s) => s.techStack.push("容器 / 编排") },
  { test: /\b(ollama|llama\.?cpp|vllm|llamaindex|langchain|langgraph|autogen|crewai)\b/i, push: (s) => s.techStack.push("LLM 框架") },
  { test: /\b(openai|anthropic|gemini|mistral|qwen)\b/i, push: (s) => s.techStack.push("外部模型 Provider") },
  { test: /\b(vector|chroma|weaviate|pinecone|qdrant|faiss|pgvector)\b/i, push: (s) => s.techStack.push("向量库") },
  { test: /\b(tauri|electron|capacitor)\b/i, push: (s) => s.techStack.push("桌面 / 客户端壳") },
  { test: /\b(websocket|ws|sse|webrtc)\b/i, push: (s) => s.techStack.push("实时通信") },
  { test: /\b(wasm|webassembly)\b/i, push: (s) => s.techStack.push("WebAssembly") },
];

const ARCH_RULES: SignalRule[] = [
  { test: /\b(plugin|extension|addon)\b/i, push: (s) => s.architecturePattern.push("插件系统") },
  { test: /\b(agent|multi[- ]?agent|tool[- ]?calling)\b/i, push: (s) => s.architecturePattern.push("Agent 架构") },
  { test: /\b(workflow|pipeline|dag|orchestrat)/i, push: (s) => s.architecturePattern.push("工作流 / 编排") },
  { test: /\b(queue|scheduler|cron|worker)\b/i, push: (s) => s.architecturePattern.push("队列 / 调度") },
  { test: /\b(memory|rag|retriev|embedding|knowledge)/i, push: (s) => s.architecturePattern.push("记忆 / RAG") },
  { test: /\b(state ?machine|fsm|xstate)\b/i, push: (s) => s.architecturePattern.push("状态机") },
  { test: /\b(sandbox|isolat|jail|container)/i, push: (s) => s.architecturePattern.push("沙盒 / 隔离") },
  { test: /\b(telemetry|observab|metric|tracing|logging)/i, push: (s) => s.architecturePattern.push("可观测") },
  { test: /\b(daemon|background|service)\b/i, push: (s) => s.architecturePattern.push("常驻服务") },
  { test: /\b(generator|scaffold|template)\b/i, push: (s) => s.architecturePattern.push("生成器 / 模板") },
];

function dedupe(arr: string[]): string[] {
  return Array.from(new Set(arr.filter(Boolean)));
}

export function scanOpenArchitecture(source: OpenArchitectureSource): ScanSignals {
  const text = [source.title, source.rawText, source.fileTree, source.url]
    .filter(Boolean)
    .join("\n");
  const signals: ScanSignals = {
    techStack: [],
    architecturePattern: [],
    dependencies: [],
    languageHints: [...(source.languageHints ?? [])],
  };
  for (const r of [...TECH_RULES, ...ARCH_RULES]) {
    if (r.test.test(text)) r.push(signals);
  }
  // 依赖名：粗略匹配 import / from / require / "dep":
  const depPattern = /(?:from ['"]([@\w./-]+)['"]|require\(['"]([@\w./-]+)['"]\)|"([@\w./-]+)"\s*:\s*"\^?\d)/g;
  let m: RegExpExecArray | null;
  while ((m = depPattern.exec(text))) {
    const dep = m[1] || m[2] || m[3];
    if (dep && !dep.startsWith(".") && !dep.startsWith("/")) signals.dependencies.push(dep);
    if (signals.dependencies.length > 40) break;
  }
  signals.techStack = dedupe(signals.techStack);
  signals.architecturePattern = dedupe(signals.architecturePattern);
  signals.dependencies = dedupe(signals.dependencies);
  signals.languageHints = dedupe(signals.languageHints);
  return signals;
}

// ===== 模块抽取（基于文件树 / 关键词）=====

interface ModuleRule {
  test: RegExp;
  build: () => Omit<OpenArchitectureModule, "id">;
}

const MODULE_RULES: ModuleRule[] = [
  {
    test: /\b(ui|components?|views?|pages?|app\/.+\.tsx)\b/i,
    build: () => ({
      name: "界面层",
      role: "提供视图与组件",
      layer: "UI",
      mappableToAether: ["Responsive Shell", "UI 模式库"],
      confidence: 0.7,
    }),
  },
  {
    test: /\b(api|server|route|controller|endpoint)\b/i,
    build: () => ({
      name: "接口层",
      role: "对外暴露 API / 路由",
      layer: "API",
      mappableToAether: ["TanStack Server Route", "App Runtime"],
      confidence: 0.7,
    }),
  },
  {
    test: /\b(agent|crew|autogen|tool[- ]?call)\b/i,
    build: () => ({
      name: "Agent 子系统",
      role: "多角色协作 / 工具调用",
      layer: "AGENT",
      mappableToAether: ["Sequence Agent Runtime"],
      confidence: 0.85,
    }),
  },
  {
    test: /\b(plugin|extension|addon|marketplace)\b/i,
    build: () => ({
      name: "插件系统",
      role: "第三方能力注册与加载",
      layer: "PLUGIN",
      mappableToAether: ["Store / WebXXM", "Permission Guard"],
      confidence: 0.85,
    }),
  },
  {
    test: /\b(workflow|pipeline|orchestrat|dag)\b/i,
    build: () => ({
      name: "工作流引擎",
      role: "任务编排与执行",
      layer: "WORKFLOW",
      mappableToAether: ["Scheduler Runtime"],
      confidence: 0.8,
    }),
  },
  {
    test: /\b(memory|rag|retriev|embedding|vector)\b/i,
    build: () => ({
      name: "记忆 / 向量层",
      role: "知识检索与压缩",
      layer: "DATA",
      mappableToAether: ["Sequence Memory", "WebLCM", "Workspace"],
      confidence: 0.85,
    }),
  },
  {
    test: /\b(state ?machine|fsm|xstate)\b/i,
    build: () => ({
      name: "状态机",
      role: "显式状态流转",
      layer: "RUNTIME",
      mappableToAether: ["MSL State Language", "Scheduler"],
      confidence: 0.8,
    }),
  },
  {
    test: /\b(telemetry|metric|tracing|logging|analytic)/i,
    build: () => ({
      name: "可观测层",
      role: "指标 / 日志 / 链路",
      layer: "OBSERVABILITY",
      mappableToAether: ["Analytics Runtime", "Record Center", "MSL"],
      confidence: 0.8,
    }),
  },
  {
    test: /\b(sandbox|isolat|seccomp|jail)/i,
    build: () => ({
      name: "沙盒 / 隔离",
      role: "受控执行环境",
      layer: "SECURITY",
      mappableToAether: ["Code Sandbox", "Local Gateway", "Permission Guard"],
      confidence: 0.85,
    }),
  },
  {
    test: /\b(daemon|background|local server|cli|node[- ]?server)\b/i,
    build: () => ({
      name: "本机守护进程",
      role: "本地长驻服务",
      layer: "RUNTIME",
      mappableToAether: ["Local Gateway"],
      confidence: 0.75,
    }),
  },
  {
    test: /\b(prompt|template|chain|graph)\b/i,
    build: () => ({
      name: "提示词系统",
      role: "Prompt 模板与链",
      layer: "RUNTIME",
      mappableToAether: ["计算法链", "常数宇宙"],
      confidence: 0.7,
    }),
  },
  {
    test: /\b(provider|llm|model)\b/i,
    build: () => ({
      name: "模型 Provider",
      role: "对接外部 / 本地模型",
      layer: "MODEL",
      mappableToAether: ["Ollama / LLM Provider"],
      confidence: 0.8,
    }),
  },
];

let __idSeq = 0;
function nextId(prefix: string): string {
  __idSeq += 1;
  return `${prefix}-${Date.now().toString(36)}-${__idSeq.toString(36)}`;
}

export function extractModules(source: OpenArchitectureSource): OpenArchitectureModule[] {
  const text = [source.title, source.rawText, source.fileTree].filter(Boolean).join("\n");
  const seen = new Set<string>();
  const out: OpenArchitectureModule[] = [];
  for (const r of MODULE_RULES) {
    if (r.test.test(text)) {
      const base = r.build();
      if (seen.has(base.name)) continue;
      seen.add(base.name);
      out.push({ id: nextId("OAM"), ...base });
    }
  }
  return out;
}

// ===== 能力抽取 =====

const CAPABILITY_FROM_LAYER: Record<OpenArchitectureModuleLayer, OpenArchitectureCapabilityType> = {
  UI: "UI_PATTERN",
  API: "OTHER",
  RUNTIME: "WORKFLOW",
  DATA: "MEMORY",
  MODEL: "MODEL_PROVIDER",
  AGENT: "AGENT_TOOL",
  PLUGIN: "PLUGIN",
  WORKFLOW: "WORKFLOW",
  SECURITY: "SANDBOX",
  OBSERVABILITY: "ANALYTICS",
  OTHER: "OTHER",
};

export function extractCapabilities(
  source: OpenArchitectureSource,
  modules: OpenArchitectureModule[],
): OpenArchitectureCapability[] {
  return modules.map((m) => ({
    id: nextId("OAC"),
    name: `${m.name}能力`,
    description: `从「${source.title}」抽取的 ${m.name}，可映射到：${m.mappableToAether.join("、") || "—"}`,
    capabilityType: CAPABILITY_FROM_LAYER[m.layer],
    riskLevel: estimateModuleRisk(m),
    suggestedAetherTarget: m.mappableToAether,
  }));
}

function estimateModuleRisk(m: OpenArchitectureModule): "LOW" | "MEDIUM" | "HIGH" {
  if (m.layer === "SECURITY" || m.layer === "PLUGIN") return "HIGH";
  if (m.layer === "AGENT" || m.layer === "RUNTIME" || m.layer === "MODEL") return "MEDIUM";
  return "LOW";
}

// ===== 风险分析 =====

export function analyzeRisks(
  source: OpenArchitectureSource,
  signals: ScanSignals,
  modules: OpenArchitectureModule[],
): string[] {
  const risks: string[] = [];
  const text = (source.rawText ?? "") + (source.title ?? "");
  if (/\b(eval|exec|spawn|child_process|shell)\b/i.test(text)) {
    risks.push("代码中包含 eval / shell 调用，必须在 Code Sandbox / Local Gateway 内运行。");
  }
  if (/\b(license|gpl|agpl|sspl|bsl)\b/i.test(text)) {
    risks.push("可能涉及 GPL / AGPL / SSPL / BSL 等强约束许可证，需法务复核。");
  } else {
    risks.push("未在描述中发现明确许可证，请人工核对开源协议。");
  }
  if (modules.some((m) => m.layer === "PLUGIN")) {
    risks.push("含插件系统：第三方代码可能携带高权限，需经过 Permission Guard。");
  }
  if (signals.techStack.includes("外部模型 Provider")) {
    risks.push("依赖外部模型 Provider：可能产生数据出境与计费风险。");
  }
  if (/\b(fs|filesystem|os|process|child_process)\b/.test(text)) {
    risks.push("访问本机文件系统 / 进程：需经 Local Gateway 限制路径。");
  }
  return risks;
}

// ===== 数据 / UI / 运行时流抽取（粗略）=====

export function extractFlows(source: OpenArchitectureSource) {
  const text = [source.rawText, source.fileTree].filter(Boolean).join("\n").toLowerCase();
  const dataFlow: string[] = [];
  const uiFlow: string[] = [];
  const runtimeFlow: string[] = [];
  if (/\binput\b|\bprompt\b/.test(text)) uiFlow.push("用户输入 → 视图层");
  if (/\b(api|route|endpoint)\b/.test(text)) runtimeFlow.push("视图 → API / 路由");
  if (/\b(agent|tool)\b/.test(text)) runtimeFlow.push("路由 → Agent / 工具调用");
  if (/\b(memory|rag|vector)\b/.test(text)) dataFlow.push("用户上下文 → 记忆 / 向量检索 → 回注");
  if (/\b(model|llm|provider)\b/.test(text)) runtimeFlow.push("上下文 → LLM Provider → 响应");
  if (/\b(metric|telemetry|log)/.test(text)) dataFlow.push("运行事件 → 可观测层");
  if (dataFlow.length === 0) dataFlow.push("（未在描述中识别明确数据流）");
  if (runtimeFlow.length === 0) runtimeFlow.push("（未在描述中识别明确运行时流）");
  if (uiFlow.length === 0) uiFlow.push("（未在描述中识别明确 UI 流）");
  return { dataFlow, uiFlow, runtimeFlow };
}

export function extractSecurityBoundaries(source: OpenArchitectureSource): string[] {
  const text = (source.rawText ?? "").toLowerCase();
  const out: string[] = [];
  if (/\b(auth|jwt|oauth|session)\b/.test(text)) out.push("身份认证");
  if (/\b(rbac|permission|role|acl)\b/.test(text)) out.push("权限 / 角色");
  if (/\b(sandbox|isolat)\b/.test(text)) out.push("沙盒隔离");
  if (/\b(rate ?limit|quota)\b/.test(text)) out.push("速率 / 配额");
  if (out.length === 0) out.push("（未识别明确安全边界，吸收前需人工评估）");
  return out;
}

// 供 Runtime 复用的 ID 生成器
export function nextOaId(prefix: string): string {
  return nextId(prefix);
}
