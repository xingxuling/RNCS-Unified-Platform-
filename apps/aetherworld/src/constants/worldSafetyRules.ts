// 虚拟世界安全规则 World Safety Rules
export const WORLD_SAFETY_TEXT = `这个虚拟世界是基于用户输入与主体结构生成的象征性世界模型。
它用于自我理解、创作、游戏化体验和决策辅助。
它不是绝对命运，不代表真实世界必然发生。
NPC 是关系结构原型，不代表现实具体人物。
本系统不提供医疗、法律、金融、投资或心理诊断建议。`;

export const FULL_WORLD_PRIVACY_HINT = "深度世界会读取 Full 60 完整主体数列，请只在私密环境中使用。";
export const DEMO_WORLD_HINT = "这是模拟世界，不代表你的真实个人世界。";
export const NPC_DISCLAIMER = "NPC 是关系结构原型，不代表现实中某个具体人，除非用户主动映射。";

export const FORBIDDEN_LANGUAGE = ["必然发生", "一定会", "100%准确", "命中注定", "保证出现"];
export const SAFE_LANGUAGE = ["可能表现为", "当前更倾向于", "建议观察", "需要回验确认", "建议小步推进"];

export function checkSafetyLanguage(text: string): { ok: boolean; flagged: string[] } {
  const flagged = FORBIDDEN_LANGUAGE.filter(w => text.includes(w));
  return { ok: flagged.length === 0, flagged };
}
