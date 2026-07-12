import type { RealityScienceConstant } from "./physicsConstantsDigital";

function c(id: string, name: string, cn: string, meaning: string, positive: string, risk: string, example: string, actions: string[]): RealityScienceConstant {
  return { id, name, userFriendlyName: cn, meaning, positiveUse: positive, risk, example, relatedActions: actions };
}

export const AESTHETIC_CONSTANTS_DIGITAL: RealityScienceConstant[] = [
  c("FORM_COHERENCE","Form Coherence","形态一致性","视/语/功能一致。","统一系统。","不一致。","按钮风格混乱。",["设计系统"]),
  c("SYMBOL_MEMORY","Symbol Memory","符号记忆点","能否记住。","设计 anchor。","无记忆点。","logo 一周忘。",["强符号"]),
  c("EMOTIONAL_TONE","Emotional Tone","情绪基调","冷/暖/神秘。","贴合主题。","错调。","严肃产品花哨。",["调性表"]),
  c("VISUAL_DENSITY","Visual Density","视觉密度","是否过满。","控制密度。","过满。","首屏 20 控件。",["留白"]),
  c("MYTHIC_AURA","Mythic Aura","神话感","高位叙事吸引。","象征化。","神化过头。","术语堆神话。",["平衡"]),
  c("PROFESSIONAL_POLISH","Professional Polish","专业完成度","像正式产品。","打磨细节。","粗糙。","截图带 lorem。",["打磨"]),
  c("ACCESSIBILITY_OF_BEAUTY","Accessibility of Beauty","美感可理解度","普通用户可接受。","降门槛。","只悦自己。","只为内行设计。",["双层呈现"]),
  c("ICONICITY","Iconicity","标志性","独特 IP。","建立 icon。","泛化。","与其他产品长得一样。",["独特记号"]),
  c("AESTHETIC_RISK","Aesthetic Risk","审美风险","玄/冷/复杂/中二过度。","自检。","失衡。","通篇 sci-fi 词。",["审美 QA"]),
  c("STYLE_TRANSFERABILITY","Style Transferability","风格迁移性","可迁 PPT/官网/虚拟世界。","风格可迁移。","锁死。","只在 App 里好看。",["风格资产"]),
];
