// User Mode UI Adapter
import { UI_USER_MODES, type UIUserMode, type UIUserModeDefinition } from "@/constants/ui-update/uiUserModes";
import type { UIModuleDefinition } from "./uiModuleRegistry";

export { UI_USER_MODES };
export type { UIUserMode, UIUserModeDefinition };

/** 同一模块对不同用户的标题/说明变体 */
const TITLE_VARIANTS: Record<string, Partial<Record<UIUserMode, { title: string; subtitle: string }>>> = {
  msl: {
    PLAIN_USER:      { title: "数列解释器",         subtitle: "输入一段数字，得到解读。" },
    STRUCTURED_USER: { title: "母体数列语言",        subtitle: "用数列定义语义结构。" },
    DEVELOPER_USER:  { title: "MSL Runtime",         subtitle: "Mother Sequence Language 运行时。" },
    CREATOR_USER:    { title: "数列灵感",            subtitle: "把灵感映射到数列结构。" },
    FOUNDER_USER:    { title: "MSL · Mother Sequence Language", subtitle: "系统级 MSL 运行时与编译器。" },
  },
  "system-constitution": {
    PLAIN_USER:      { title: "系统规则",            subtitle: "Aetherworld 的安全与隐私边界。" },
    STRUCTURED_USER: { title: "系统宪法",            subtitle: "条款 / 类别 / 严重程度。" },
    DEVELOPER_USER:  { title: "Constitution Engine", subtitle: "Compliance / Violations / Versions。" },
    CREATOR_USER:    { title: "创作边界",            subtitle: "可创作什么、不可生成什么。" },
    FOUNDER_USER:    { title: "System Constitution v0.2", subtitle: "最高治理层。" },
  },
  "sequence-currency": {
    PLAIN_USER:      { title: "积分与贡献",          subtitle: "系统内部积分，不可提现。" },
    STRUCTURED_USER: { title: "数列价值",            subtitle: "INTERNAL_ONLY ledger。" },
    DEVELOPER_USER:  { title: "Sequence Currency",   subtitle: "Non-financial internal ledger。" },
    CREATOR_USER:    { title: "创作积分",            subtitle: "创作贡献的内部记录。" },
    FOUNDER_USER:    { title: "Sequence Currency Engine", subtitle: "Founder Locked: non-financial。" },
  },
};

export function adaptModuleForUserMode(
  module: UIModuleDefinition, userMode: UIUserMode,
): { title: string; subtitle: string } {
  const v = TITLE_VARIANTS[module.moduleId]?.[userMode];
  if (v) return v;
  return { title: module.chineseName, subtitle: module.moduleName };
}

export function getUserModeDefinition(userMode: UIUserMode): UIUserModeDefinition {
  const f = UI_USER_MODES.find((m) => m.id === userMode);
  if (!f) throw new Error("Unknown user mode");
  return f;
}
