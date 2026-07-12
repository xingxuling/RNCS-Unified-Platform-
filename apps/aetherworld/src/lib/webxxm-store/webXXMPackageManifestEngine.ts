import { WEB_CAPABILITY_IDS, type WebCapabilityId } from "@/constants/web-capability/webCapabilityTypes";
import type { WebXXMPackageManifest } from "./webXXMStoreTypes";

const NAMES: Record<WebCapabilityId, { en: string; zh: string; desc: string }> = {
  WEB_CODE_M:     { en: "WebCodeM",     zh: "代码能力模型",   desc: "代码生成、修复、解释与重构。" },
  WEB_PRODUCT_M:  { en: "WebProductM",  zh: "产品能力模型",   desc: "PRD、用户故事、信息架构与需求分解。" },
  WEB_DESIGN_M:   { en: "WebDesignM",   zh: "设计能力模型",   desc: "信息层级、界面骨架、组件与排版方案。" },
  WEB_MUSIC_M:    { en: "WebMusicM",    zh: "音乐能力模型",   desc: "歌曲结构、AI 音乐提示词与声乐草案。" },
  WEB_STORY_M:    { en: "WebStoryM",    zh: "叙事能力模型",   desc: "剧情、章节、人物弧光与世界文本。" },
  WEB_RESEARCH_M: { en: "WebResearchM", zh: "研究能力模型",   desc: "文献综述、问题分解、证据链与推论。" },
  WEB_BIZ_M:      { en: "WebBizM",      zh: "商业能力模型",   desc: "商业模式、定价、增长与运营策略。" },
  WEB_TEACH_M:    { en: "WebTeachM",    zh: "教学能力模型",   desc: "课程结构、练习题、教学路径与评估。" },
  WEB_OPS_M:      { en: "WebOpsM",      zh: "运营能力模型",   desc: "排程、SOP、运维计划与异常响应。" },
  WEB_STRATEGY_M: { en: "WebStrategyM", zh: "战略能力模型",   desc: "目标拆解、路径选择、风险与对抗推演。" },
  WEB_GAME_M:     { en: "WebGameM",     zh: "游戏能力模型",   desc: "玩法机制、关卡设计与任务循环。" },
  WEB_AGENT_M:    { en: "WebAgentM",    zh: "Agent 能力模型", desc: "智能体计划、工具调用与多步任务。" },
};

const NEEDS_LLM: WebCapabilityId[] = ["WEB_CODE_M", "WEB_STORY_M", "WEB_RESEARCH_M", "WEB_AGENT_M", "WEB_PRODUCT_M", "WEB_DESIGN_M", "WEB_MUSIC_M", "WEB_BIZ_M", "WEB_TEACH_M", "WEB_OPS_M", "WEB_STRATEGY_M", "WEB_GAME_M"];

const now = new Date().toISOString();

export function buildBuiltInManifests(): WebXXMPackageManifest[] {
  return WEB_CAPABILITY_IDS.map<WebXXMPackageManifest>((capabilityId, idx) => {
    const meta = NAMES[capabilityId];
    const id = capabilityId.toLowerCase().replace(/_/g, "-");
    const needsLlm = NEEDS_LLM.includes(capabilityId);
    return {
      packageId: id,
      capabilityId,
      name: meta.en,
      chineseName: meta.zh,
      version: "0.1.0",
      description: meta.desc,
      author: "Aetherworld Official",
      packageType: idx < 2 ? "CORE" : "OFFICIAL",
      source: "BUILT_IN_REGISTRY",
      requiredAetherVersion: "0.9.0",
      dependencies: [
        { dependencyId: "weblkm", type: "WEBLKM", required: true },
        { dependencyId: "webcm",  type: "WEBCM",  required: true },
        { dependencyId: "webcom", type: "WEBCOM", required: true },
        { dependencyId: "weblcm", type: "WEBLCM", required: true },
        ...(needsLlm ? [{ dependencyId: "webllm", type: "WEBLLM" as const, required: false }] : []),
        { dependencyId: "qa",        type: "QA",        required: true },
        { dependencyId: "workspace", type: "WORKSPACE", required: true },
      ],
      permissions: [
        { permissionId: "read-workspace", name: "读取工作区", description: "读取当前工作区对象。", riskLevel: "LOW", requiredFor: ["上下文构建"] },
        { permissionId: "write-workspace", name: "写入工作区", description: "把输出写入工作区对象。", riskLevel: "MEDIUM", requiredFor: ["保存结果"] },
      ],
      providedObjects: [`${meta.en}_OUTPUT_OBJECT`],
      providedCommands: [`${id}.run`],
      providedRoutes: ["/web-capability-run"],
      runtimeAdapters: ["APP_RUNTIME", "CODE_SANDBOX", "WORKSPACE"],
      qaRules: ["NO_OVERCLAIM", "SOURCE_VERIFICATION"],
      safetyRules: ["NO_FULL60_RAW", "NO_SECRETS", "NO_AUTO_EXECUTE"],
      installSize: "~120 KB",
      checksum: `chk_${id}_v0_1_0`,
      signatureStatus: "LOCAL_TRUSTED",
      status: { status: "AVAILABLE", lastChangedAt: now },
      createdAt: now,
      updatedAt: now,
    };
  });
}
