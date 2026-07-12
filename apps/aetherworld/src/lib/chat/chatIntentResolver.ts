import type { ChatIntentType, ChatInputMode } from "@/constants/chat/chatIntentTypes";
import { resolveCommandIntent } from "@/lib/command-canvas/commandIntentResolver";
import { classifyChatInputMode } from "./chatInputModeClassifier";
import type { WebCapabilityId } from "@/constants/web-capability/webCapabilityTypes";

export interface ChatIntentResult {
  intentType: ChatIntentType;
  inputMode: ChatInputMode;
  targetRuntime: string;
  requiredCapability?: WebCapabilityId;
  targetObjectType?: string;
  pageRoute?: string;
  confidence: number;
  rationale: string;
  /** 高风险动作（删除 / 部署 / 发消息 / 上传 / 付款 / 真实执行）需用户二次确认 */
  needsConfirmation?: boolean;
  /** Ask 模式下可能的推荐路径，给 ASK→DO 卡片使用 */
  recommendedPath?: { label: string; action: string; route?: string; capability?: WebCapabilityId }[];
}

const PAGE_KEYWORDS: { keys: string[]; route: string; label: string }[] = [
  { keys: ["webxxm store", "能力商店", "能力市场"], route: "/webxxm-store", label: "能力商店" },
  { keys: ["weblwm 世界库", "world library", "世界库"], route: "/weblwm-worlds", label: "世界库" },
  { keys: ["weblwm"], route: "/weblwm-runtime", label: "世界模型" },
  { keys: ["weblcm"], route: "/weblcm-runtime", label: "概念模型" },
  { keys: ["webllm"], route: "/real-webllm", label: "本地语言模型" },
  { keys: ["weblkm", "知识三体"], route: "/web-knowledge-trinity", label: "Web 知识三体" },
  { keys: ["代码沙箱", "code sandbox"], route: "/code-sandbox", label: "代码沙箱" },
  { keys: ["app runtime", "应用运行时", "应用生成器"], route: "/app-runtime", label: "应用生成器" },
  { keys: ["对话历史", "chat history"], route: "/chat-history", label: "对话历史" },
  { keys: ["对话设置", "chat settings"], route: "/chat-settings", label: "对话设置" },
];

const INSTALL_RX = /(安装|install|下载|启用)[\s\S]*?(webxxm|web[a-z]+m|能力)/i;
const DANGEROUS_RX = /(删除|delete|drop\s+table|部署|deploy|发布|上传|upload|付款|payment|真实执行|执行真实)/i;

function detailedAskIntent(raw: string): ChatIntentType {
  if (/(区别|对比|vs\b|相比|不同)/i.test(raw)) return "ASK_COMPARISON";
  if (/(怎么做|如何做|步骤|流程|how to|how do)/i.test(raw)) return "ASK_HOW_TO";
  if (/(为什么|原因|根因|为何)/i.test(raw)) return "ASK_DIAGNOSIS";
  if (/(分析|评估|评价|看看|怎么样)/i.test(raw)) return "ASK_ANALYSIS";
  if (/(策略|路线|规划|计划)/i.test(raw)) return "ASK_STRATEGY";
  if (/(能力|webxxm|webcm|weblkm|webllm|webcom|weblcm|weblwm).*(有什么用|是什么|做什么)/i.test(raw)) return "ASK_CAPABILITY";
  if (/(系统|平台).*(状态|缺什么|怎么了|健康)/i.test(raw)) return "ASK_SYSTEM_STATUS";
  return "ASK_EXPLANATION";
}

function detailedAskToDoIntent(raw: string): ChatIntentType {
  if (/(能不能|可不可以|能否|可否|可行|值不值得)/i.test(raw)) return "ASK_TO_DO_FEASIBILITY";
  if (/(推荐|建议|哪个更好|选哪个|怎么选)/i.test(raw)) return "ASK_TO_DO_RECOMMENDATION";
  return "ASK_TO_DO_PLANNING";
}

function detailedDoIntent(raw: string, fromCommand: string): ChatIntentType {
  if (/^(打开|进入|查看)/i.test(raw) || fromCommand === "OPEN_OBJECT") return "DO_OPEN";
  if (INSTALL_RX.test(raw)) return "DO_INSTALL";
  if (/(检查|审计|qa|质量检查)/i.test(raw) || fromCommand === "CHECK_QA") return "DO_CHECK";
  if (/(导出|export|下载结果)/i.test(raw) || fromCommand === "EXPORT") return "DO_EXPORT";
  if (/(编辑|修改|更新)/i.test(raw)) return "DO_EDIT";
  if (/(保存|save)/i.test(raw)) return "DO_SAVE";
  if (/(删除|delete)/i.test(raw)) return "DO_DELETE_REQUEST";
  if (/(运行|执行|跑|simulate|tick)/i.test(raw) || fromCommand === "RUN_WORLD_TICK") return "DO_RUN";
  if (/(创建|新建|做一个|生成)/i.test(raw)) return "DO_CREATE";
  return "DO_RUN";
}

function detailedMixedIntent(raw: string): ChatIntentType {
  if (/(创建|生成|新建)/i.test(raw)) return "MIXED_ANALYZE_AND_CREATE";
  if (/(运行|执行|跑)/i.test(raw)) return "MIXED_ANALYZE_AND_RUN";
  return "MIXED_PLAN_AND_EXECUTE";
}

function buildRecommendedPath(raw: string): ChatIntentResult["recommendedPath"] {
  const low = raw.toLowerCase();
  const out: NonNullable<ChatIntentResult["recommendedPath"]> = [];
  if (/(app|应用|网页)/i.test(raw)) {
    out.push({ label: "创建应用", action: "create_app", route: "/app-runtime" });
  }
  if (/(音乐|歌词|歌|prompt)/i.test(raw)) {
    out.push({ label: "安装音乐能力", action: "install", route: "/webxxm-store", capability: "WEB_MUSIC_M" as WebCapabilityId });
    out.push({ label: "生成歌词 / Prompt", action: "create_music", route: "/vocal-engine" });
  }
  if (/(代码|修复|patch|bug)/i.test(raw)) {
    out.push({ label: "打开代码沙箱", action: "open", route: "/code-sandbox" });
  }
  if (/(世界|world|剧情)/i.test(raw)) {
    out.push({ label: "打开世界生成器", action: "open", route: "/world-runtime" });
  }
  if (/(检查|qa|审计)/i.test(raw)) {
    out.push({ label: "打开 QA 审计", action: "open", route: "/system-audit" });
  }
  if (out.length === 0) {
    out.push({ label: "打开能力商店", action: "open", route: "/webxxm-store" });
    out.push({ label: "查看文档", action: "open", route: "/docs" });
  }
  return out.slice(0, 4);
}

export function resolveChatIntent(raw: string): ChatIntentResult {
  const lower = raw.toLowerCase().trim();
  const mode = classifyChatInputMode(raw);

  // 打开页面（DO_OPEN）短路
  for (const p of PAGE_KEYWORDS) {
    if (p.keys.some((k) => lower.includes(k.toLowerCase()))) {
      if (/^(打开|open|进入|查看)/i.test(raw)) {
        return {
          intentType: "DO_OPEN",
          inputMode: "DO_MODE",
          targetRuntime: "WORKSPACE",
          pageRoute: p.route,
          confidence: 0.9,
          rationale: `识别为打开页面：${p.label}`,
        };
      }
    }
  }

  // 安装能力
  if (mode.mode === "DO_MODE" && INSTALL_RX.test(raw)) {
    return {
      intentType: "DO_INSTALL",
      inputMode: "DO_MODE",
      targetRuntime: "WORKSPACE",
      pageRoute: "/webxxm-store",
      confidence: 0.85,
      rationale: "识别为安装能力模型意图。",
    };
  }

  // 复用底层 command resolver 抓出可能的能力 / 对象类型
  const ci = resolveCommandIntent(raw);
  const requiredCapability = ci.selectedCapabilityIds[0] as WebCapabilityId | undefined;
  const targetObjectType = ci.targetObjectType;

  if (mode.mode === "ASK_MODE") {
    return {
      intentType: detailedAskIntent(raw),
      inputMode: "ASK_MODE",
      targetRuntime: "ASK",
      requiredCapability,
      targetObjectType,
      confidence: 0.75,
      rationale: mode.rationale,
      recommendedPath: buildRecommendedPath(raw),
    };
  }

  if (mode.mode === "ASK_TO_DO_MODE") {
    return {
      intentType: detailedAskToDoIntent(raw),
      inputMode: "ASK_TO_DO_MODE",
      targetRuntime: "ASK",
      requiredCapability,
      targetObjectType,
      confidence: 0.75,
      rationale: mode.rationale,
      recommendedPath: buildRecommendedPath(raw),
    };
  }

  if (mode.mode === "MIXED_MODE") {
    return {
      intentType: detailedMixedIntent(raw),
      inputMode: "MIXED_MODE",
      targetRuntime: ci.targetRuntime ?? "SEQUENCE_AI",
      requiredCapability,
      targetObjectType,
      confidence: 0.7,
      rationale: mode.rationale,
      recommendedPath: buildRecommendedPath(raw),
      needsConfirmation: DANGEROUS_RX.test(raw),
    };
  }

  // DO_MODE
  return {
    intentType: detailedDoIntent(raw, ci.intentType),
    inputMode: "DO_MODE",
    targetRuntime: ci.targetRuntime ?? "SEQUENCE_AI",
    requiredCapability,
    targetObjectType,
    confidence: 0.8,
    rationale: mode.rationale,
    needsConfirmation: DANGEROUS_RX.test(raw),
  };
}
