// 进化突变类型 Evolution Mutation Types
export type MutationRisk = "LOW" | "MEDIUM" | "HIGH";

export interface EvolutionMutationTypeDef {
  id: string;
  name: string;
  description: string;
  defaultRisk: MutationRisk;
  founderOnly?: boolean;
}

export const EVOLUTION_MUTATION_TYPES: EvolutionMutationTypeDef[] = [
  { id: "HOME_REORDER",                name: "首页模块重排",       description: "根据使用频率调整首页模块顺序。",            defaultRisk: "LOW" },
  { id: "MODULE_PIN",                  name: "固定常用模块",       description: "把常用模块固定到首页快捷区。",              defaultRisk: "LOW" },
  { id: "MODULE_HIDE",                 name: "隐藏低使用模块",     description: "把长期不使用的模块折叠到高级区。",          defaultRisk: "MEDIUM" },
  { id: "LANGUAGE_SHIFT",              name: "切换语言层级",       description: "根据偏好调整默认语言层。",                  defaultRisk: "LOW" },
  { id: "UI_DENSITY_SHIFT",            name: "调整 UI 密度",        description: "切换紧凑/标准/宽松 UI 密度。",              defaultRisk: "LOW" },
  { id: "EVENT_PRIORITY_SHIFT",        name: "事件优先级调整",     description: "提升常被回验命中的事件类型权重。",          defaultRisk: "MEDIUM" },
  { id: "DIMENSION_PRIORITY_SHIFT",    name: "维度优先级调整",     description: "调整 15 维度的展示与计算优先级。",          defaultRisk: "MEDIUM" },
  { id: "FEEDBACK_REMINDER_ADJUST",    name: "回验提醒调整",       description: "调整回验提醒的频率与时机。",                defaultRisk: "LOW" },
  { id: "PROMPT_TEMPLATE_PRIORITIZE",  name: "提示词模板升权",     description: "提升某类 Prompt 模板的推荐排序。",          defaultRisk: "LOW" },
  { id: "WORLD_MODE_PRIORITIZE",       name: "世界模式升权",       description: "把常用世界模式设为默认。",                  defaultRisk: "LOW" },
  { id: "SAFETY_LEVEL_INCREASE",       name: "提升安全等级",       description: "提高 Safety Boundary 提示等级。",           defaultRisk: "LOW" },
  { id: "BEGINNER_TO_ADVANCED",        name: "切换为高级模式",     description: "推荐用户从新手模式切到高级模式。",          defaultRisk: "MEDIUM" },
  { id: "ADVANCED_TO_SIMPLIFIED",      name: "切换为简化模式",     description: "推荐用户回到简化模式。",                    defaultRisk: "LOW" },
  { id: "FOUNDER_SHORTCUT_ENABLE",     name: "启用创始人快捷",     description: "在创始人模式下启用专属快捷入口。",          defaultRisk: "HIGH", founderOnly: true },
  { id: "PERSONAL_APP_PROFILE_UPDATE", name: "更新个人 App 配置",  description: "整体更新 Personal App Profile。",            defaultRisk: "MEDIUM" },
];

export interface EvolutionMutation {
  id: string;
  type: string;
  reason: string;
  affectedModules: string[];
  beforeState: Record<string, unknown>;
  afterState: Record<string, unknown>;
  riskLevel: MutationRisk;
  requiresConfirmation: boolean;
  createdAt: string;
  applied?: boolean;
  appliedAt?: string;
  ignored?: boolean;
}

export function getMutationDef(id: string) {
  return EVOLUTION_MUTATION_TYPES.find(m => m.id === id);
}
