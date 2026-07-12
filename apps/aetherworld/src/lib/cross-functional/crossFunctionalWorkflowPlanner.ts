import type { CrossFunctionalObject } from "./crossFunctionalObjectAnalyzer";
import type { CrossFunctionalWorkflowType } from "@/constants/cross-functional/crossFunctionalWorkflowTypes";

export interface CrossFunctionalWorkflowStep {
  stepId: string;
  stepName: string;
  engineId: string;
  inputSummary: string;
  outputSummary: string;
  canAutoRun: boolean;
  requiresUserReview: boolean;
  status: "PENDING" | "RUNNING" | "DONE" | "SKIPPED" | "BLOCKED";
}

export interface CrossFunctionalWorkflow {
  workflowId: string;
  title: string;
  workflowType: CrossFunctionalWorkflowType;
  inputObject: CrossFunctionalObject;
  steps: CrossFunctionalWorkflowStep[];
  expectedOutputs: string[];
  requiredEngines: string[];
  optionalEngines: string[];
  estimatedComplexity: "LOW" | "MEDIUM" | "HIGH";
  userMode: "PUBLIC" | "ADVANCED" | "FOUNDER";
}

const STEP_TEMPLATES: Record<CrossFunctionalWorkflowType, Array<Omit<CrossFunctionalWorkflowStep, "stepId" | "status">>> = {
  CHARACTER_ASSET_PACK: [
    { stepName:"剧情文本", engineId:"narrative", inputSummary:"角色设定", outputSummary:"剧情片段", canAutoRun:true, requiresUserReview:false },
    { stepName:"角色歌歌词", engineId:"vocal", inputSummary:"剧情+角色", outputSummary:"歌词草稿", canAutoRun:true, requiresUserReview:true },
    { stepName:"声乐 Prompt", engineId:"promptForge", inputSummary:"歌词+声线", outputSummary:"Suno/Udio Prompt", canAutoRun:true, requiresUserReview:false },
    { stepName:"翻译", engineId:"translation", inputSummary:"歌词", outputSummary:"多语言版", canAutoRun:true, requiresUserReview:false },
    { stepName:"宣传文案", engineId:"copy", inputSummary:"角色+歌曲", outputSummary:"短文案", canAutoRun:true, requiresUserReview:false },
    { stepName:"Workspace 保存", engineId:"workspace", inputSummary:"所有资产", outputSummary:"已保存对象", canAutoRun:true, requiresUserReview:false },
  ],
  WORLD_ASSET_PACK: [
    { stepName:"世界百科", engineId:"worldKnowledge", inputSummary:"世界设定", outputSummary:"百科条目", canAutoRun:true, requiresUserReview:false },
    { stepName:"剧情任务", engineId:"narrative", inputSummary:"世界冲突", outputSummary:"任务剧情", canAutoRun:true, requiresUserReview:false },
    { stepName:"世界主题曲", engineId:"vocal", inputSummary:"世界美学", outputSummary:"主题曲设定", canAutoRun:true, requiresUserReview:true },
    { stepName:"视觉 Prompt", engineId:"model", inputSummary:"世界元素", outputSummary:"模型 Prompt", canAutoRun:true, requiresUserReview:false },
    { stepName:"多世界引用", engineId:"multiverse", inputSummary:"世界 ID", outputSummary:"跨世界关系", canAutoRun:true, requiresUserReview:false },
    { stepName:"导出世界设定包", engineId:"export", inputSummary:"完整世界", outputSummary:"导出文件", canAutoRun:true, requiresUserReview:false },
  ],
  SONG_PRODUCTION_PACK: [
    { stepName:"歌词生成", engineId:"vocal", inputSummary:"主题", outputSummary:"歌词", canAutoRun:true, requiresUserReview:true },
    { stepName:"声乐风格", engineId:"vocal", inputSummary:"主题/情绪", outputSummary:"vocalStyle", canAutoRun:true, requiresUserReview:false },
    { stepName:"Suno Prompt", engineId:"promptForge", inputSummary:"风格+歌词", outputSummary:"Prompt", canAutoRun:true, requiresUserReview:false },
    { stepName:"中英日版本", engineId:"translation", inputSummary:"歌词", outputSummary:"多语言版", canAutoRun:true, requiresUserReview:false },
    { stepName:"发布文案", engineId:"copy", inputSummary:"歌曲", outputSummary:"短文案", canAutoRun:true, requiresUserReview:false },
    { stepName:"歌曲百科条目", engineId:"productEncyclopedia", inputSummary:"歌曲", outputSummary:"条目", canAutoRun:true, requiresUserReview:false },
  ],
  PRODUCT_BUILD_PACK: [
    { stepName:"产品模型", engineId:"model", inputSummary:"概念", outputSummary:"productModel", canAutoRun:true, requiresUserReview:false },
    { stepName:"功能列表", engineId:"productEncyclopedia", inputSummary:"模型", outputSummary:"功能清单", canAutoRun:true, requiresUserReview:false },
    { stepName:"Prompt Forge", engineId:"promptForge", inputSummary:"产品+功能", outputSummary:"代码 Prompt", canAutoRun:true, requiresUserReview:false },
    { stepName:"代码生成", engineId:"code", inputSummary:"Prompt", outputSummary:"代码任务", canAutoRun:false, requiresUserReview:true },
    { stepName:"文档", engineId:"learningDocs", inputSummary:"产品+代码", outputSummary:"文档", canAutoRun:true, requiresUserReview:false },
    { stepName:"QA", engineId:"softwareQA", inputSummary:"代码+文档", outputSummary:"QA 报告", canAutoRun:true, requiresUserReview:false },
    { stepName:"版本跃迁判断", engineId:"versionLeap", inputSummary:"差异", outputSummary:"版本建议", canAutoRun:true, requiresUserReview:false },
  ],
  SEQUENCE_CREATION_PACK: [
    { stepName:"解析", engineId:"msl", inputSummary:"母体数列", outputSummary:"语义", canAutoRun:true, requiresUserReview:false },
    { stepName:"世界风格", engineId:"world", inputSummary:"语义", outputSummary:"世界风格建议", canAutoRun:true, requiresUserReview:false },
    { stepName:"角色设定", engineId:"narrative", inputSummary:"世界", outputSummary:"角色", canAutoRun:true, requiresUserReview:false },
    { stepName:"声乐风格", engineId:"vocal", inputSummary:"数列+角色", outputSummary:"声乐风格", canAutoRun:true, requiresUserReview:false },
    { stepName:"剧情基调", engineId:"narrative", inputSummary:"世界+角色", outputSummary:"基调", canAutoRun:true, requiresUserReview:false },
    { stepName:"UI 主题建议", engineId:"uiUpdate", inputSummary:"整体", outputSummary:"UI 主题", canAutoRun:true, requiresUserReview:false },
  ],
};

const TITLES: Record<CrossFunctionalWorkflowType, string> = {
  CHARACTER_ASSET_PACK: "A · 角色资产包",
  WORLD_ASSET_PACK: "B · 世界资产包",
  SONG_PRODUCTION_PACK: "C · 歌曲生产包",
  PRODUCT_BUILD_PACK: "D · 产品落地包",
  SEQUENCE_CREATION_PACK: "E · 数列创作包",
};

export function planCrossFunctionalWorkflow(
  obj: CrossFunctionalObject,
  type: CrossFunctionalWorkflowType,
  userMode: "PUBLIC" | "ADVANCED" | "FOUNDER" = "PUBLIC",
): CrossFunctionalWorkflow {
  const tpls = STEP_TEMPLATES[type];
  const steps: CrossFunctionalWorkflowStep[] = tpls.map((t, i) => ({
    ...t,
    stepId: `step_${i + 1}`,
    status: "PENDING",
  }));
  return {
    workflowId: `cfw_${Date.now().toString(36)}`,
    title: TITLES[type],
    workflowType: type,
    inputObject: obj,
    steps,
    expectedOutputs: steps.map((s) => s.outputSummary),
    requiredEngines: Array.from(new Set(steps.map((s) => s.engineId))),
    optionalEngines: [],
    estimatedComplexity: steps.length >= 7 ? "HIGH" : steps.length >= 5 ? "MEDIUM" : "LOW",
    userMode,
  };
}

export function listAllWorkflowTemplates(obj: CrossFunctionalObject): CrossFunctionalWorkflow[] {
  return (Object.keys(STEP_TEMPLATES) as CrossFunctionalWorkflowType[])
    .map((t) => planCrossFunctionalWorkflow(obj, t));
}
