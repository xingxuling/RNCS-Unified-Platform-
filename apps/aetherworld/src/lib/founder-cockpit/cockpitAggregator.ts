// 创始人中枢 状态聚合器 - 安全读取已有模块的本地状态
import type {
  CockpitDecisionView,
  FactoryCardData,
  FiveDomainStatus,
  WorldRadarSignal,
  ProductForgeItem,
  EvolutionRow,
} from "./cockpitTypes";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeReadJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeArrayLen(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

interface FactorySnapshot {
  trainingSamples: number;
  evalSamples: number;
  sealedDatasets: number;
  vlmSamples: number;
  factoryTasks: number;
  factoryRunning: number;
  factoryFailed: number;
  capabilityAssets: number;
  agiDecisions: number;
  bossDecisions: number;
  externalSignals: number;
}

export function readFactorySnapshot(): FactorySnapshot {
  const trainingSamples = safeArrayLen(
    safeReadJson<unknown[]>("aether.aetherseed.training-samples.v1", []),
  );
  const evalSamples = safeArrayLen(
    safeReadJson<unknown[]>("aether.aetherseed.eval-samples.v1", []),
  );
  const sealedDatasets = safeArrayLen(
    safeReadJson<unknown[]>("aether.aetherseed.smoke-sealed.v1", []),
  );
  const vlmSamples = safeArrayLen(
    safeReadJson<unknown[]>("aether.aetherseed-vl.samples.v1", []),
  );
  const factoryStore = safeReadJson<{ tasks?: unknown[] }>(
    "aether.autonomous-factory.store.v1",
    {},
  );
  const factoryTasks = Array.isArray(factoryStore.tasks) ? factoryStore.tasks.length : 0;
  const factoryRunning = Array.isArray(factoryStore.tasks)
    ? factoryStore.tasks.filter(
        (t) => typeof t === "object" && t !== null && (t as { status?: string }).status === "RUNNING",
      ).length
    : 0;
  const factoryFailed = Array.isArray(factoryStore.tasks)
    ? factoryStore.tasks.filter(
        (t) => typeof t === "object" && t !== null && (t as { status?: string }).status === "FAILED",
      ).length
    : 0;
  const capabilityAssets = safeArrayLen(
    safeReadJson<unknown[]>("aether.capability-assets.v1", []),
  );
  const agiStore = safeReadJson<{ decisions?: unknown[] }>("aether.local-agi.store.v1", {});
  const agiDecisions = Array.isArray(agiStore.decisions) ? agiStore.decisions.length : 0;
  const bossStore = safeReadJson<{ decisions?: unknown[] }>("aether.aetherboss.store.v1", {});
  const bossDecisions = Array.isArray(bossStore.decisions) ? bossStore.decisions.length : 0;
  const externalSignals = safeArrayLen(
    safeReadJson<unknown[]>("aether.local-agi.external-signals.v1", []),
  );

  return {
    trainingSamples,
    evalSamples,
    sealedDatasets,
    vlmSamples,
    factoryTasks,
    factoryRunning,
    factoryFailed,
    capabilityAssets,
    agiDecisions,
    bossDecisions,
    externalSignals,
  };
}

export function buildFiveDomainStatus(): FiveDomainStatus[] {
  const s = readFactorySnapshot();
  return [
    {
      domain: "TIAN",
      headline: "天势 · 世界雷达",
      detail: `已捕获外界信号 ${s.externalSignals} 条`,
      health: s.externalSignals > 0 ? "GREEN" : "IDLE",
    },
    {
      domain: "DI",
      headline: "地基 · 无人工厂",
      detail: `工厂任务 ${s.factoryTasks} 个，运行中 ${s.factoryRunning}，失败 ${s.factoryFailed}`,
      health:
        s.factoryFailed > 0
          ? "RED"
          : s.factoryRunning > 0
            ? "GREEN"
            : s.factoryTasks > 0
              ? "AMBER"
              : "IDLE",
    },
    {
      domain: "REN",
      headline: "人机协作 · 创始人 × AGI",
      detail: `专属 AGI 决策 ${s.agiDecisions} 条，总策 Agent 决策 ${s.bossDecisions} 条`,
      health: s.agiDecisions + s.bossDecisions > 0 ? "GREEN" : "IDLE",
    },
    {
      domain: "SHEN",
      headline: "神轴 · 使命与叙事",
      detail: "Aetherworld 创世叙事已建立，模型血统已开始登记",
      health: "GREEN",
    },
    {
      domain: "FENG",
      headline: "风口 · 增长与传播",
      detail: `已封版数据集 ${s.sealedDatasets} 个，能力资产 ${s.capabilityAssets} 个待投放`,
      health: s.sealedDatasets > 0 ? "GREEN" : "IDLE",
    },
  ];
}

export function buildDecisionView(): CockpitDecisionView {
  const s = readFactorySnapshot();
  if (s.factoryFailed > 0) {
    return {
      observed: `工厂出现 ${s.factoryFailed} 个失败任务`,
      chosenFactory: "系统健康工厂",
      reason: "失败任务会阻塞后续训练与发布，必须先修复",
      estimatedValue: "P0",
      nextStep: "进入失败恢复中心，逐个生成恢复计划",
      needsFounderApproval: false,
    };
  }
  if (s.trainingSamples < 5000) {
    return {
      observed: `当前训练样本 ${s.trainingSamples} 条，不足以训练高质量 300M 模型`,
      chosenFactory: "材料工厂",
      reason: "样本量不足，优先做材料投喂以扩大数据基础",
      estimatedValue: "P1",
      nextStep: "打开种子投喂炉，批量投喂中长样本",
      needsFounderApproval: false,
    };
  }
  if (s.sealedDatasets === 0) {
    return {
      observed: "暂无封版数据集",
      chosenFactory: "训练工厂",
      reason: "样本量已可冒烟，建议封版 AetherSeed-300M-Smoke-Dataset-v0.1",
      estimatedValue: "P1",
      nextStep: "进入数据血池，执行封版流程",
      needsFounderApproval: true,
    };
  }
  return {
    observed: "数据与工厂状态良好",
    chosenFactory: "公司工厂",
    reason: "可以开始生成能力资产、产品草案与商店上架草稿",
    estimatedValue: "P2",
    nextStep: "进入产品锻造台，挑选可发布候选",
    needsFounderApproval: true,
  };
}

export function buildFactoryCards(): FactoryCardData[] {
  const s = readFactorySnapshot();
  return [
    {
      factory: "MATERIAL",
      label: "材料工厂 · 吃材料产样本",
      input: "种子、文件、链接、用户反馈",
      running: `${s.trainingSamples + s.evalSamples} 条样本在池`,
      output: `训练 ${s.trainingSamples} / 评测 ${s.evalSamples}`,
      failures: "—",
      nextStep: "继续投喂中长样本",
      automationLevel: "L2",
    },
    {
      factory: "TRAINING",
      label: "训练工厂 · 吃数据产模型",
      input: `封版数据集 ${s.sealedDatasets} 个`,
      running: "等待无人值守训练守护进程",
      output: `VLM 样本 ${s.vlmSamples} 条`,
      failures: "—",
      nextStep: "本地启动训练守护进程",
      automationLevel: "L2",
    },
    {
      factory: "DEVELOPMENT",
      label: "开发工厂 · 吃需求产功能",
      input: "用户反馈、错误日志、Lovable 返回",
      running: "正在生成开发任务草案",
      output: "新页面、修复、能力包",
      failures: "—",
      nextStep: "查看专属 AGI 决策日志",
      automationLevel: "L3",
    },
    {
      factory: "COMPANY",
      label: "公司工厂 · 吃能力产资产",
      input: `能力资产 ${s.capabilityAssets} 个`,
      running: "产品锻造草案生成中",
      output: "商店草案 / 产品页面",
      failures: "—",
      nextStep: "进入产品锻造台",
      automationLevel: "L2",
    },
    {
      factory: "HEALTH",
      label: "系统健康工厂 · 吃失败产修复",
      input: `失败任务 ${s.factoryFailed} 个`,
      running: s.factoryFailed > 0 ? "失败恢复中心待处理" : "全绿",
      output: "恢复计划、免疫规则",
      failures: `${s.factoryFailed}`,
      nextStep: s.factoryFailed > 0 ? "立即修复" : "保持监听",
      automationLevel: "L3",
    },
  ];
}

export function buildWorldRadarSignals(): WorldRadarSignal[] {
  return [
    {
      id: "ws_open_models",
      category: "MODEL",
      title: "开源 VLM 模型持续放量",
      detail: "Qwen-VL、InternVL、MiniCPM-V 等近期更新，可作为 AetherSeed-VL 微调底座",
      potentialOutcomes: ["MODEL_EXPERIMENT", "DATASET", "CAPABILITY_PACK"],
    },
    {
      id: "ws_agent_frameworks",
      category: "TECH",
      title: "Agentic OS 框架持续涌现",
      detail: "LangGraph / OpenAgents / Lovable-style 工作流已成方向，可作为 AetherBoss 调度参考",
      potentialOutcomes: ["DEV_TASK", "CAPABILITY_PACK"],
    },
    {
      id: "ws_user_signal_seed",
      category: "USER_SIGNAL",
      title: "创始人级用户期望可关屏继续训练",
      detail: "本地无人值守训练已上线，下一步可对外讲好故事",
      potentialOutcomes: ["GROWTH_TASK", "PRODUCT_PAGE"],
    },
    {
      id: "ws_opp_private_model",
      category: "OPPORTUNITY",
      title: "私有 LoRA / SFT 模型有市场",
      detail: "可上架 AetherSeed-VL Private v0.1 商店草案",
      potentialOutcomes: ["STORE_DRAFT", "PRODUCT_PAGE"],
    },
    {
      id: "ws_competitor_observability",
      category: "COMPETITOR",
      title: "竞品强调可观测训练",
      detail: "需要把模型血统、数据血统、失败恢复做成对外可见",
      potentialOutcomes: ["DEV_TASK", "PRODUCT_PAGE"],
    },
  ];
}

export function buildProductForgeItems(): ProductForgeItem[] {
  const s = readFactorySnapshot();
  return [
    {
      id: "pf_smoke_dataset",
      name: "AetherSeed-300M-Smoke-Dataset",
      kind: "DATASET",
      status: s.sealedDatasets > 0 ? "RELEASABLE" : "TESTABLE",
      audience: "内部冒烟训练",
      value: "验证 300M 模型链路",
      risk: "样本平均 token 偏短，不适合正式训练",
      nextStep: s.sealedDatasets > 0 ? "登记进模型血统" : "执行封版",
    },
    {
      id: "pf_vlm_private",
      name: "AetherSeed-VL Private v0.1",
      kind: "MODEL",
      status: "DRAFT",
      audience: "创始人、内部团队",
      value: "看懂截图、生成下一步建议",
      risk: "需要本地 GPU、底座许可校验",
      nextStep: "完成 dry-run 后登记血统",
    },
    {
      id: "pf_cockpit_page",
      name: "创始人中枢驾驶舱",
      kind: "PAGE",
      status: "RELEASABLE",
      audience: "创始人",
      value: "一站式公司操控",
      risk: "需持续聚合新模块",
      nextStep: "对外做产品页",
    },
    {
      id: "pf_factory_os",
      name: "无人工厂操作系统",
      kind: "CAPABILITY",
      status: "TESTABLE",
      audience: "高级用户",
      value: "五大工厂统一调度",
      risk: "依赖本地守护进程",
      nextStep: "出 capability 包",
    },
    {
      id: "pf_growth_report",
      name: "今日增长报告",
      kind: "REPORT",
      status: "TESTABLE",
      audience: "创始人 / 投资人",
      value: "Aetherworld 每天变强了什么",
      risk: "—",
      nextStep: "接入分享通道",
    },
  ];
}

export function buildEvolutionRows(): EvolutionRow[] {
  const s = readFactorySnapshot();
  const now = Date.now();
  return [
    {
      id: "ev_data_smoke",
      category: "DATA",
      title: "AetherSeed 冒烟数据集",
      delta: `训练样本 ${s.trainingSamples} 条 / 评测 ${s.evalSamples} 条`,
      at: now,
    },
    {
      id: "ev_model_vlm",
      category: "MODEL",
      title: "AetherSeed-VL Private",
      delta: `VLM 样本 ${s.vlmSamples} 条已就位`,
      at: now,
    },
    {
      id: "ev_product_cockpit",
      category: "PRODUCT",
      title: "创始人中枢上线",
      delta: "六大一级导航 + 五域结构",
      at: now,
    },
    {
      id: "ev_failure_health",
      category: "FAILURE",
      title: "系统健康",
      delta: `当前失败任务 ${s.factoryFailed} 个`,
      at: now,
    },
    {
      id: "ev_feedback_boss",
      category: "FEEDBACK",
      title: "总策 Agent 决策吸收",
      delta: `${s.bossDecisions} 条总策判断已沉淀`,
      at: now,
    },
  ];
}

export function buildGrowthScore(): { score: number; reasons: string[] } {
  const s = readFactorySnapshot();
  const score =
    Math.min(40, Math.floor(s.trainingSamples / 300)) +
    Math.min(20, s.sealedDatasets * 10) +
    Math.min(15, s.vlmSamples) +
    Math.min(15, s.agiDecisions + s.bossDecisions) +
    Math.min(10, s.externalSignals);
  return {
    score,
    reasons: [
      `训练样本贡献 ${Math.min(40, Math.floor(s.trainingSamples / 300))}`,
      `封版数据贡献 ${Math.min(20, s.sealedDatasets * 10)}`,
      `VLM 样本贡献 ${Math.min(15, s.vlmSamples)}`,
      `AGI 决策贡献 ${Math.min(15, s.agiDecisions + s.bossDecisions)}`,
      `外界信号贡献 ${Math.min(10, s.externalSignals)}`,
    ],
  };
}
