// Recall Signal Types · 潜意识调用信号类型
export interface RecallSignalType {
  id: string;
  name: string;
  userFriendlyName: string;
  description: string;
  likelyMeaning: string;
  risk: string;
  recommendedUsage: string;
}

export const RECALL_SIGNAL_TYPES: RecallSignalType[] = [
  { id: "DREAM_FRAGMENT", name: "Dream Fragment", userFriendlyName: "梦境碎片",
    description: "睡眠中浮现的非现实场景或人物。", likelyMeaning: "潜意识在整理未消化的象征材料。",
    risk: "可能被近期影像污染。", recommendedUsage: "先记录，不下结论。" },
  { id: "DEJA_VU_SIGNAL", name: "Déjà Vu Signal", userFriendlyName: "既视感信号",
    description: "对未经历过的场景产生强烈熟悉感。", likelyMeaning: "大脑模式匹配触发的象征强度。",
    risk: "极易过度解释为前世。", recommendedUsage: "记录情境与情绪，不做现实判断。" },
  { id: "SYMBOLIC_IMAGE", name: "Symbolic Image", userFriendlyName: "象征图像",
    description: "反复出现的具象图像（塔、剑、风、海等）。", likelyMeaning: "原型层主题的视觉化呈现。",
    risk: "可能受作品/AI 图像污染。", recommendedUsage: "用于创作素材与自我观察。" },
  { id: "HISTORICAL_ECHO", name: "Historical Echo", userFriendlyName: "历史回声",
    description: "对某一历史时代有异常亲近或排斥。", likelyMeaning: "情感投射与文化共鸣。",
    risk: "易被影视题材塑造。", recommendedUsage: "作为兴趣线索而非身份证明。" },
  { id: "PLACE_MEMORY", name: "Place Memory", userFriendlyName: "地点记忆感",
    description: "对某地名/地形产生身体反应。", likelyMeaning: "环境符号触发深层联想。",
    risk: "可能是儿时被忽略的记忆。", recommendedUsage: "记录身体反应，不预设来源。" },
  { id: "MUSIC_MEMORY", name: "Music Memory", userFriendlyName: "音乐触发记忆",
    description: "音乐唤起非今生的场景感。", likelyMeaning: "情绪与象征的强耦合。",
    risk: "高度情绪化，易膨胀。", recommendedUsage: "用于创作与情感命名。" },
  { id: "BODY_RESONANCE", name: "Body Resonance", userFriendlyName: "身体共振",
    description: "听到/看到某主题时的身体反应。", likelyMeaning: "躯体层的隐性记忆信号。",
    risk: "勿替代医疗判断。", recommendedUsage: "标注强度与位置即可。" },
  { id: "LANGUAGE_ECHO", name: "Language Echo", userFriendlyName: "语言回声",
    description: "对未知或古老语言有熟悉感。", likelyMeaning: "音韵原型的潜在吸引。",
    risk: "勿伪造翻译。", recommendedUsage: "记录音节与情绪。" },
  { id: "CHARACTER_ECHO", name: "Character Echo", userFriendlyName: "角色回声",
    description: "感觉自己曾是某种角色（祭司/战士等）。", likelyMeaning: "原型自我投射。",
    risk: "易自我神话化。", recommendedUsage: "用于创作设定。" },
  { id: "MYTHIC_ECHO", name: "Mythic Echo", userFriendlyName: "神话回声",
    description: "对某神话体系反复回响。", likelyMeaning: "意义结构需求。",
    risk: "过度神化。", recommendedUsage: "象征性使用。" },
  { id: "CIVILIZATION_ECHO", name: "Civilization Echo", userFriendlyName: "文明回声",
    description: "对某文明形态强烈共鸣。", likelyMeaning: "价值偏好的象征。",
    risk: "勿当真实身份。", recommendedUsage: "构建虚拟世界的素材。" },
  { id: "TRAUMA_ECHO", name: "Trauma Echo", userFriendlyName: "创伤回声",
    description: "反复浮现的痛苦/死亡/分离意象。", likelyMeaning: "未处理情绪的象征化。",
    risk: "需要心理支持，勿独自深挖。", recommendedUsage: "如影响生活请寻求专业帮助。" },
  { id: "MISSION_ECHO", name: "Mission Echo", userFriendlyName: "使命回声",
    description: "对某种「必须做的事」的内在拉力。", likelyMeaning: "主线方向的象征压力。",
    risk: "易被宿命化。", recommendedUsage: "拆为可验证小目标。" },
  { id: "RELATIONSHIP_ECHO", name: "Relationship Echo", userFriendlyName: "关系回声",
    description: "对某人有「早已认识」的感觉。", likelyMeaning: "关系原型激活。",
    risk: "不得判定他人前世身份。", recommendedUsage: "仅用于自我理解。" },
  { id: "CREATIVE_SOURCE_SIGNAL", name: "Creative Source Signal", userFriendlyName: "创作源信号",
    description: "创作中自动浮现的世界观/角色/场景。", likelyMeaning: "原型层的创作输出。",
    risk: "低。", recommendedUsage: "直接接入创作与虚拟世界。" },
];

export const RECALL_SOURCE_CONTEXTS = [
  "DREAM", "MEDITATION", "DEJA_VU", "CREATIVE_FLASH",
  "BODY_RESONANCE", "HISTORICAL_TRIGGER", "MUSIC_TRIGGER", "PLACE_TRIGGER", "UNKNOWN",
] as const;
export type RecallSourceContext = typeof RECALL_SOURCE_CONTEXTS[number];
