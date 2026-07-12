import type { CrossFunctionalObjectType } from "@/constants/cross-functional/crossFunctionalVariableTypes";

export interface CrossFunctionalObject {
  objectId: string;
  objectType: CrossFunctionalObjectType;
  objectName?: string;
  coreVariables: string[];
  emotionalVariables: string[];
  narrativeVariables: string[];
  worldVariables: string[];
  technicalVariables: string[];
  reusableVariables: string[];
  nonTransferableVariables: string[];
}

const HINTS: Array<{ re: RegExp; type: CrossFunctionalObjectType }> = [
  { re: /(角色|主角|character)/i, type: "CHARACTER" },
  { re: /(世界|世界观|world)/i, type: "WORLD" },
  { re: /(故事|剧情|story|narrative)/i, type: "STORY" },
  { re: /(歌词|lyric)/i, type: "LYRIC" },
  { re: /(歌曲|歌|song)/i, type: "SONG" },
  { re: /(产品|product)/i, type: "PRODUCT" },
  { re: /(模型|model)/i, type: "MODEL" },
  { re: /(代码|code)/i, type: "CODE" },
  { re: /(prompt|提示词)/i, type: "PROMPT" },
  { re: /(数列|sequence|\b\d{4,5}\b)/i, type: "SEQUENCE" },
  { re: /(词汇|术语)/, type: "VOCABULARY_TERM" },
  { re: /(计算法|calculus)/i, type: "CALCULUS" },
  { re: /(引擎|engine)/i, type: "ENGINE" },
  { re: /(用户|user)/i, type: "USER_PROFILE" },
  { re: /(外部数据|reality data)/i, type: "REALITY_DATA" },
  { re: /(视觉|视觉概念|visual)/i, type: "VISUAL_CONCEPT" },
];

const TEMPLATES: Record<CrossFunctionalObjectType, Pick<CrossFunctionalObject, "coreVariables"|"emotionalVariables"|"narrativeVariables"|"worldVariables"|"technicalVariables"|"reusableVariables"|"nonTransferableVariables">> = {
  CHARACTER: { coreVariables:["名字","身份","性格","关系"], emotionalVariables:["主题情绪","内在冲突"], narrativeVariables:["核心冲突","成长弧"], worldVariables:["所属世界"], technicalVariables:["声线倾向","视觉符号"], reusableVariables:["名字","主题情绪","视觉符号","声线倾向"], nonTransferableVariables:["创始人私密设定"] },
  WORLD: { coreVariables:["世界名","基础规则","文明阶段"], emotionalVariables:["氛围"], narrativeVariables:["冲突结构","叙事题材"], worldVariables:["美学风格","角色入口"], technicalVariables:["音乐氛围"], reusableVariables:["世界名","美学风格","氛围"], nonTransferableVariables:["内部正典锁定项"] },
  STORY: { coreVariables:["概要","角色"], emotionalVariables:["情绪基调"], narrativeVariables:["冲突","结构"], worldVariables:["世界上下文"], technicalVariables:[], reusableVariables:["角色","情绪基调"], nonTransferableVariables:[] },
  SONG: { coreVariables:["标题","主题"], emotionalVariables:["情绪","曲风"], narrativeVariables:["剧情绑定"], worldVariables:[], technicalVariables:["声线","节奏","结构"], reusableVariables:["标题","主题","情绪"], nonTransferableVariables:[] },
  LYRIC: { coreVariables:["主题","意象"], emotionalVariables:["情绪曲线"], narrativeVariables:["故事段落"], worldVariables:[], technicalVariables:["语言","押韵"], reusableVariables:["主题","意象"], nonTransferableVariables:[] },
  PRODUCT: { coreVariables:["产品名","用户","痛点"], emotionalVariables:["价值主张"], narrativeVariables:["使用场景"], worldVariables:[], technicalVariables:["功能","架构"], reusableVariables:["产品名","用户","痛点"], nonTransferableVariables:["商业机密"] },
  MODEL: { coreVariables:["模型名","用途"], emotionalVariables:[], narrativeVariables:[], worldVariables:[], technicalVariables:["输入","输出","结构"], reusableVariables:["模型名","用途"], nonTransferableVariables:["训练权重"] },
  CODE: { coreVariables:["模块","API"], emotionalVariables:[], narrativeVariables:[], worldVariables:[], technicalVariables:["语言","依赖"], reusableVariables:["模块","API"], nonTransferableVariables:["密钥"] },
  PROMPT: { coreVariables:["目标","平台"], emotionalVariables:["语气"], narrativeVariables:[], worldVariables:[], technicalVariables:["平台格式"], reusableVariables:["目标","语气"], nonTransferableVariables:[] },
  SEQUENCE: { coreVariables:["digits","sum"], emotionalVariables:["情绪倾向"], narrativeVariables:["叙事倾向"], worldVariables:["世界倾向"], technicalVariables:["MSL 模式"], reusableVariables:["digits","情绪倾向"], nonTransferableVariables:["Full60 私密含义"] },
  VOCABULARY_TERM: { coreVariables:["术语","定义"], emotionalVariables:[], narrativeVariables:[], worldVariables:[], technicalVariables:["关系"], reusableVariables:["术语","定义"], nonTransferableVariables:["Founder-only 词条"] },
  CALCULUS: { coreVariables:["计算法名","输入","输出"], emotionalVariables:[], narrativeVariables:[], worldVariables:[], technicalVariables:["关联引擎"], reusableVariables:["计算法名","示例"], nonTransferableVariables:[] },
  ENGINE: { coreVariables:["引擎名","入口","输出"], emotionalVariables:[], narrativeVariables:[], worldVariables:[], technicalVariables:["依赖"], reusableVariables:["引擎名"], nonTransferableVariables:[] },
  USER_PROFILE: { coreVariables:["主体模式","偏好"], emotionalVariables:[], narrativeVariables:[], worldVariables:[], technicalVariables:[], reusableVariables:["偏好"], nonTransferableVariables:["Full60 私密","身份信息"] },
  REALITY_DATA: { coreVariables:["来源","内容"], emotionalVariables:[], narrativeVariables:[], worldVariables:[], technicalVariables:["可信度","新鲜度"], reusableVariables:["内容","来源"], nonTransferableVariables:["未授权 PII"] },
  VISUAL_CONCEPT: { coreVariables:["主题","符号"], emotionalVariables:["氛围"], narrativeVariables:[], worldVariables:[], technicalVariables:["风格"], reusableVariables:["主题","符号","氛围"], nonTransferableVariables:[] },
};

export function analyzeCrossFunctionalObject(text: string, hint?: CrossFunctionalObjectType, name?: string): CrossFunctionalObject {
  const type = hint ?? (HINTS.find((h) => h.re.test(text))?.type ?? "STORY");
  const tpl = TEMPLATES[type];
  return {
    objectId: `cfo_${Date.now().toString(36)}`,
    objectType: type,
    objectName: name,
    ...tpl,
  };
}
