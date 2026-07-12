// 畅想式融合 · 概念种子抽取
// 不读源码，只从项目名 / 描述中抽取概念种子，与 project-fusion scanner 配合
import type { ProjectConceptSeed } from "./imaginativeFusionTypes";
import { sanitizeImaginativeInput } from "./imaginativeFusionSafetyPolicy";

const CONCEPT_DICT: { key: RegExp; concepts: string[]; modules: string[]; world?: string[]; auto?: string[]; biz?: string[] }[] = [
  { key: /chat|对话|assistant|助手|agent/i, concepts: ["对话主入口", "Agent 协作", "工具调用"], modules: ["Chat", "Agent"], auto: ["流式回答", "意图路由"], biz: ["AI 助手订阅"] },
  { key: /workspace|object|工作区|项目管理/i, concepts: ["对象宇宙", "版本时间线", "关系图"], modules: ["Workspace"], biz: ["团队协作 SaaS"] },
  { key: /calendar|schedule|日历|任务|trigger/i, concepts: ["时间轴", "触发器", "热力图"], modules: ["Calendar", "Scheduler"], auto: ["周期任务", "自动复查"] },
  { key: /store|plugin|插件|capability|webxxm/i, concepts: ["能力包", "权限授权", "市场分发"], modules: ["Store"], biz: ["创作者抽成", "企业能力市场"] },
  { key: /social|feed|发布|社区/i, concepts: ["时间线", "公开发布"], modules: ["Social"], biz: ["创作者社区"] },
  { key: /world|character|世界|角色|narrative|叙事|音乐|vocal/i, concepts: ["世界观", "角色", "叙事推进", "音乐"], modules: ["World Engine"], world: ["角色生命线", "世界事件"], auto: ["事件算法自动推进"] },
  { key: /sandbox|app builder|code|runtime/i, concepts: ["代码运行", "应用模板", "诊断"], modules: ["Sandbox", "App Runtime"], biz: ["App 模板市场"] },
  { key: /analytics|dashboard|统计|指标/i, concepts: ["指标聚合", "时序"], modules: ["Analytics"] },
  { key: /record|audit|回验|审计|verification/i, concepts: ["事件记录", "回验", "重要性评分"], modules: ["Record Center"], auto: ["自动回验"] },
  { key: /ollama|llm|provider|gateway|本地模型/i, concepts: ["本地模型", "供应商抽象", "健康探针"], modules: ["LLM Provider"], biz: ["本地 AI OS"] },
  { key: /life os|personal os|生活os|虚拟生活/i, concepts: ["每日流", "对象宇宙", "个人 OS"], modules: ["Life OS"], world: ["虚拟生活"] },
  { key: /virtual world|world os|虚拟世界/i, concepts: ["世界 OS", "事件自动推进"], modules: ["World OS"], world: ["世界日志"] },
  { key: /track|decision|决策|企业/i, concepts: ["决策记录", "风险预测"], modules: ["Decision Engine"], biz: ["企业决策工作台"] },
];

export function extractConceptSeed(projectName: string, description: string): ProjectConceptSeed {
  const safe = sanitizeImaginativeInput(description ?? "");
  const text = `${projectName} ${safe}`;
  const concepts = new Set<string>();
  const modules = new Set<string>();
  const world = new Set<string>();
  const automation = new Set<string>();
  const business = new Set<string>();
  for (const e of CONCEPT_DICT) {
    if (e.key.test(text)) {
      e.concepts.forEach((c) => concepts.add(c));
      e.modules.forEach((m) => modules.add(m));
      (e.world ?? []).forEach((w) => world.add(w));
      (e.auto ?? []).forEach((a) => automation.add(a));
      (e.biz ?? []).forEach((b) => business.add(b));
    }
  }
  return {
    projectName: projectName || "未命名项目",
    positioning: safe.slice(0, 160) || "未提供定位说明",
    concepts: Array.from(concepts),
    modules: Array.from(modules),
    worldElements: Array.from(world),
    automation: Array.from(automation),
    businessHints: Array.from(business),
  };
}

export function extractConceptSeeds(inputs: { projectName: string; description: string }[]): ProjectConceptSeed[] {
  return inputs.map((i) => extractConceptSeed(i.projectName, i.description));
}
