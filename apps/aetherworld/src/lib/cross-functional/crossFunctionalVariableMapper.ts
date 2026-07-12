import type { CrossFunctionalObject } from "./crossFunctionalObjectAnalyzer";
import type { CrossFunctionalVariableTransformation } from "@/constants/cross-functional/crossFunctionalVariableTypes";

export interface TransferableVariable {
  variableName: string;
  sourceMeaning: string;
  targetMeaning: string;
  transformationType: CrossFunctionalVariableTransformation;
  requiredAdaptation: string;
}

export interface BlockedVariable {
  variableName: string;
  reason: string;
  safetyNote?: string;
}

export interface CrossFunctionalVariableMap {
  mapId: string;
  sourceObjectType: string;
  targetEngine: string;
  transferableVariables: TransferableVariable[];
  blockedVariables: BlockedVariable[];
  transformationRules: string[];
  confidence: number;
}

const PRESETS: Record<string, Record<string, TransferableVariable[]>> = {
  CHARACTER: {
    vocal: [
      { variableName:"名字", sourceMeaning:"角色名", targetMeaning:"歌曲主角名", transformationType:"DIRECT_COPY", requiredAdaptation:"保留" },
      { variableName:"主题情绪", sourceMeaning:"角色情绪倾向", targetMeaning:"副歌情绪", transformationType:"EMOTION_MAPPING", requiredAdaptation:"映射到 emotionCurve" },
      { variableName:"声线倾向", sourceMeaning:"声线设定", targetMeaning:"vocalProfile", transformationType:"DIRECT_COPY", requiredAdaptation:"按 vocal 引擎字段重命名" },
    ],
    narrative: [
      { variableName:"核心冲突", sourceMeaning:"角色冲突", targetMeaning:"主线冲突", transformationType:"STRUCTURE_MAPPING", requiredAdaptation:"三幕式拆分" },
    ],
    model: [
      { variableName:"视觉符号", sourceMeaning:"视觉元素", targetMeaning:"模型提示词关键词", transformationType:"PROMPT_PACKAGING", requiredAdaptation:"按平台封装" },
    ],
  },
  WORLD: {
    vocal: [
      { variableName:"美学风格", sourceMeaning:"世界美学", targetMeaning:"音乐氛围", transformationType:"STYLE_TRANSFER", requiredAdaptation:"映射到 musicStyle" },
    ],
    narrative: [
      { variableName:"冲突结构", sourceMeaning:"世界冲突", targetMeaning:"任务冲突", transformationType:"STRUCTURE_MAPPING", requiredAdaptation:"按任务模板拆解" },
    ],
    model: [
      { variableName:"角色入口", sourceMeaning:"主要角色", targetMeaning:"模型角色", transformationType:"DIRECT_COPY", requiredAdaptation:"" },
    ],
  },
  SONG: {
    translation: [
      { variableName:"歌词", sourceMeaning:"原始语言", targetMeaning:"目标语言演唱版", transformationType:"LANGUAGE_ADAPTATION", requiredAdaptation:"保留语气与押韵" },
    ],
    promptForge: [
      { variableName:"主题+情绪+曲风", sourceMeaning:"歌曲设定", targetMeaning:"Suno/Udio Prompt", transformationType:"PROMPT_PACKAGING", requiredAdaptation:"按平台模板" },
    ],
  },
  PRODUCT: {
    code: [
      { variableName:"功能", sourceMeaning:"产品功能", targetMeaning:"模块 API", transformationType:"TECHNICAL_TRANSLATION", requiredAdaptation:"拆分为端点 / 组件" },
    ],
    learningDocs: [
      { variableName:"价值主张", sourceMeaning:"卖点", targetMeaning:"文档导语", transformationType:"DIRECT_COPY", requiredAdaptation:"" },
    ],
  },
  SEQUENCE: {
    world: [
      { variableName:"digits", sourceMeaning:"数列原值", targetMeaning:"世界生成种子", transformationType:"TECHNICAL_TRANSLATION", requiredAdaptation:"通过 MSL 解析" },
    ],
    vocal: [
      { variableName:"情绪倾向", sourceMeaning:"数列推导情绪", targetMeaning:"曲风倾向", transformationType:"EMOTION_MAPPING", requiredAdaptation:"映射到 musicStyle" },
    ],
  },
};

export function mapCrossFunctionalVariables(
  obj: CrossFunctionalObject,
  targetEngine: string,
): CrossFunctionalVariableMap {
  const transferable = PRESETS[obj.objectType]?.[targetEngine] ?? [];
  const blocked: BlockedVariable[] = obj.nonTransferableVariables.map((v) => ({
    variableName: v,
    reason: "对象内部不可迁移项",
    safetyNote: "保留在源对象，跨域时不导出",
  }));
  return {
    mapId: `cfvm_${Date.now().toString(36)}`,
    sourceObjectType: obj.objectType,
    targetEngine,
    transferableVariables: transferable,
    blockedVariables: blocked,
    transformationRules: transferable.map((t) => `${t.variableName} → ${t.targetMeaning} (${t.transformationType})`),
    confidence: transferable.length ? 0.8 : 0.4,
  };
}
