// 畅想式融合 · 创意生成器
// 通过预设融合模板 + 跨项目交叉，生成 ImaginativeFusionIdea 列表
import type {
  ProjectConceptSeed,
  ImaginativeFusionIdea,
  ImaginativeFusionMode,
} from "./imaginativeFusionTypes";

interface Template {
  mode: ImaginativeFusionMode;
  cnTitle: string;
  title: string;
  match: (seeds: ProjectConceptSeed[]) => ProjectConceptSeed[] | null;
  targets: string[];
  description: (sources: string[]) => string;
  next: ImaginativeFusionIdea["suggestedNextStep"];
  roadmap: string[];
}

function hasModule(s: ProjectConceptSeed, kw: RegExp): boolean {
  return s.modules.some((m) => kw.test(m)) ||
         s.concepts.some((c) => kw.test(c)) ||
         kw.test(s.projectName) ||
         kw.test(s.positioning);
}

function pick(seeds: ProjectConceptSeed[], ...kws: RegExp[]): ProjectConceptSeed[] | null {
  const found = kws.map((k) => seeds.find((s) => hasModule(s, k)));
  if (found.some((f) => !f)) return null;
  return found.filter(Boolean) as ProjectConceptSeed[];
}

const TEMPLATES: Template[] = [
  {
    mode: "WORLD_FUSION",
    cnTitle: "虚拟生活 OS",
    title: "Virtual Life OS",
    match: (s) => pick(s, /calendar|日历|schedule/i, /life|生活|personal os/i),
    targets: ["Calendar", "Scheduler", "Sequence Memory", "Sequence Prediction", "Workspace"],
    description: (src) =>
      `把 ${src.join(" + ")} 融合为可自动记录、预测、安排、复盘用户与虚拟角色生活的个人 OS。`,
    next: "CREATE_WORKSPACE_OBJECT",
    roadmap: [
      "聚合每日记录到 Sequence Memory",
      "Prediction 输出明日安排候选",
      "Scheduler 自动生成复盘任务草案",
      "Workspace 中展开角色生活线",
    ],
  },
  {
    mode: "WORLD_FUSION",
    cnTitle: "自驱动虚拟世界 OS",
    title: "Self-Driving World OS",
    match: (s) => pick(s, /world|世界/i, /calendar|trigger|日历/i),
    targets: ["World Engine", "Calendar Trigger", "Social", "Sequence Agent (WORLD_AGENT)"],
    description: (src) =>
      `${src.join(" + ")} 联合，让世界引擎按日历触发自动推进角色事件、生成世界日志、并对外发布动态。`,
    next: "MAKE_BRIDGE_PLAN",
    roadmap: [
      "事件算法绑定 Calendar Trigger",
      "WORLD_AGENT 输出每日世界日志",
      "Social 草案：仅在用户确认后发布",
    ],
  },
  {
    mode: "WORKFLOW_FUSION",
    cnTitle: "产品自进化链路",
    title: "Product Self-Evolution Loop",
    match: (s) => pick(s, /analytics|统计/i, /record|audit|回验/i),
    targets: ["Analytics", "Record Center", "Bug Audit", "Scheduler", "Lovable Handoff"],
    description: (src) =>
      `${src.join(" + ")} 形成闭环：系统根据统计与回验结果自动生成下一轮 Lovable 开发提示词草案。`,
    next: "CREATE_SCHEDULER_TASK",
    roadmap: [
      "Analytics 输出周期指标快照",
      "Bug Audit 聚合未完成项",
      "生成 Handoff Pack 草案",
      "Scheduler 推送提示词复查任务",
    ],
  },
  {
    mode: "STORE_FUSION",
    cnTitle: "开源到能力包流水线",
    title: "OSS-to-WebXXM Pipeline",
    match: (s) => pick(s, /open|开源|github/i, /store|plugin|webxxm/i),
    targets: ["Open Architecture Absorption", "Store / WebXXM", "Code Sandbox", "Local Gateway"],
    description: (src) =>
      `${src.join(" + ")} 联动：识别一个开源项目即自动生成 WebXXM 能力包草案（仅草案，不自动安装）。`,
    next: "CREATE_WEBXXM_PACKAGE_DRAFT",
    roadmap: [
      "Absorption 抽取 capability",
      "生成 WebXXMPackageIdea 草案",
      "Sandbox 内试运行（沙箱受限）",
    ],
  },
  {
    mode: "AGENT_FUSION",
    cnTitle: "Aetherworld 产品团队 Agent Panel",
    title: "Internal Product Team Agents",
    match: (s) => pick(s, /agent|角色|人格/i, /code|sandbox|qa/i),
    targets: ["Sequence Agent Runtime", "QA / Bug Audit", "Analytics"],
    description: (src) =>
      `${src.join(" + ")} 组合为内部 Product / Architect / Code / QA / Analytics Agent Panel，Coordinator 输出 Top 5 行动项。`,
    next: "CREATE_AGENT_TOOL",
    roadmap: [
      "复用既有 Agent Coordinator",
      "为每个角色定义 Prompt 合约",
      "把评审结论写入 Record Center",
    ],
  },
  {
    mode: "PRODUCT_FUSION",
    cnTitle: "创作者生态平台",
    title: "Creator Ecosystem",
    match: (s) => pick(s, /world|character|音乐|vocal/i, /store|社区|社交|social/i),
    targets: ["World Engine", "Store / WebXXM", "Social", "Sequence Currency"],
    description: (src) =>
      `${src.join(" + ")} 让创作者生成世界 / 歌曲 / 角色 / 应用，并以能力包形式分发，价值通过 Sequence Currency 计量。`,
    next: "MAKE_BRIDGE_PLAN",
    roadmap: [
      "创作者首页草案",
      "能力包发布流程（仅草案）",
      "Sequence Currency 抽成模型",
    ],
  },
  {
    mode: "BUSINESS_FUSION",
    cnTitle: "Aetherworld Pro / Studio / Enterprise 产品线",
    title: "Three-Tier Product Line",
    match: (s) => pick(s, /ollama|local|gateway|本地/i, /store|capability/i),
    targets: ["LLM Provider", "Local Gateway", "Store", "Workspace"],
    description: (src) =>
      `${src.join(" + ")} 推导出三层产品线：个人版（本地模型 + 能力包）/ 工作室版（团队 Workspace）/ 企业版（私有部署 + 决策工作台）。`,
    next: "REFERENCE_ONLY",
    roadmap: [
      "定义三层定价与能力边界",
      "私有部署 Bridge Plan",
      "企业 SSO 与权限计划（高风险，仅计划）",
    ],
  },
  {
    mode: "PRODUCT_FUSION",
    cnTitle: "本地 AI 操作系统壳",
    title: "Local AI OS Shell",
    match: (s) => pick(s, /ollama|local|本地/i, /workspace|app/i),
    targets: ["LLM Provider", "Workspace", "App Runtime", "Scheduler", "Sequence Agent"],
    description: (src) =>
      `${src.join(" + ")} 形成本地 AI OS 壳：统一调度模型 / 工具 / 文件 / Agent / 应用运行时。`,
    next: "MAKE_BRIDGE_PLAN",
    roadmap: [
      "统一调度入口",
      "本地工具协议",
      "应用运行时窗口管理",
    ],
  },
  {
    mode: "WORKFLOW_FUSION",
    cnTitle: "企业决策工作台",
    title: "Enterprise Decision Workbench",
    match: (s) => pick(s, /track|decision|决策|企业/i, /analytics|record|预测/i),
    targets: ["Workspace", "Sequence Prediction", "Scheduler", "Analytics", "Record Center"],
    description: (src) =>
      `${src.join(" + ")} 形成企业决策工作台：记录判断 / 预测风险 / 安排复查 / 统计结果。`,
    next: "CREATE_WORKSPACE_OBJECT",
    roadmap: [
      "决策对象模型",
      "复查节点状态机",
      "结果回写 Analytics",
    ],
  },
];

function clamp(n: number): number {
  return Math.max(0, Math.min(10, Math.round(n)));
}

function generateFromTemplate(t: Template, sources: ProjectConceptSeed[]): ImaginativeFusionIdea {
  const sourceProjects = sources.map((s) => s.projectName);
  const sourceConcepts = Array.from(new Set(sources.flatMap((s) => s.concepts))).slice(0, 8);
  const novelty = clamp(5 + sources.length);
  const strategicFit = clamp(6 + (t.targets.length > 3 ? 2 : 1));
  const potentialValue = clamp(t.mode === "BUSINESS_FUSION" ? 9 : t.mode === "PRODUCT_FUSION" ? 8 : 7);
  const implementationDifficulty = clamp(
    t.mode === "BUSINESS_FUSION" ? 9 : t.mode === "WORLD_FUSION" ? 8 : 6,
  );
  const riskLevel: ImaginativeFusionIdea["riskLevel"] =
    implementationDifficulty >= 8 ? "HIGH" : implementationDifficulty >= 6 ? "MEDIUM" : "LOW";

  return {
    id: `IFI-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    title: t.title,
    cnTitle: t.cnTitle,
    fusionMode: t.mode,
    sourceProjects,
    sourceConcepts,
    description: t.description(sourceProjects),
    targetAetherSystems: t.targets,
    potentialValue,
    implementationDifficulty,
    strategicFit,
    novelty,
    riskLevel,
    recommendedPriority: "P2", // 临时，由 scorer 修正
    suggestedNextStep: t.next,
    roadmap: t.roadmap,
    risks: riskLevel === "HIGH"
      ? ["实现难度高，需分阶段桥接", "禁止自动迁移 Auth / Payment / DB schema"]
      : ["跨域接口需逐步对齐"],
    notes: `融合模式：${t.mode}`,
  };
}

export function generateImaginativeIdeas(seeds: ProjectConceptSeed[]): ImaginativeFusionIdea[] {
  const ideas: ImaginativeFusionIdea[] = [];
  for (const t of TEMPLATES) {
    const matched = t.match(seeds);
    if (matched && matched.length > 0) {
      ideas.push(generateFromTemplate(t, matched));
    }
  }
  // 若匹配过少，补充跨域兜底：用前两个 seed 强行做产品融合
  if (ideas.length < 3 && seeds.length >= 2) {
    const [a, b] = seeds;
    ideas.push({
      id: `IFI-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      title: `${a.projectName} × ${b.projectName}`,
      cnTitle: `${a.projectName} 与 ${b.projectName} 跨域组合`,
      fusionMode: "PRODUCT_FUSION",
      sourceProjects: [a.projectName, b.projectName],
      sourceConcepts: [...a.concepts, ...b.concepts].slice(0, 6),
      description: `把「${a.projectName}」的「${a.concepts[0] ?? "核心概念"}」嫁接到「${b.projectName}」的「${b.concepts[0] ?? "核心场景"}」，形成跨域子产品。`,
      targetAetherSystems: ["Workspace", "Chat", "Scheduler"],
      potentialValue: 6,
      implementationDifficulty: 5,
      strategicFit: 6,
      novelty: 7,
      riskLevel: "MEDIUM",
      recommendedPriority: "P2",
      suggestedNextStep: "REFERENCE_ONLY",
      roadmap: ["定义嫁接点", "Workspace 草案对象", "Chat 触发入口"],
      risks: ["跨域语义对齐成本"],
      notes: "兜底跨域组合",
    });
  }
  return ideas;
}
