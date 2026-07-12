// 进化安全规则
export interface EvolutionSafetyRule {
  id: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export const EVOLUTION_SAFETY_RULES: EvolutionSafetyRule[] = [
  { id: "NO_AUTO_CODE_CHANGE",       description: "禁止自动修改源代码。需要代码进化必须经 Code Generation Calculus 由用户确认。", severity: "CRITICAL" },
  { id: "NO_AUTO_CONSTANT_MUTATION", description: "禁止未经确认修改核心常数。",                                                    severity: "CRITICAL" },
  { id: "NO_FULL60_LEAK",            description: "禁止把 Full 60 真实主体数据写入 Personal App Profile。",                       severity: "CRITICAL" },
  { id: "NO_DEMO_REAL_MIX",          description: "Demo 与 Real 进化记忆必须隔离。",                                              severity: "HIGH" },
  { id: "NO_AUTO_FOUNDER_GRANT",     description: "禁止自动授予 Founder 权限。",                                                  severity: "CRITICAL" },
  { id: "NO_SILENT_DELETION",        description: "禁止未经确认删除用户数据。",                                                   severity: "HIGH" },
  { id: "EXPLAINABLE_MUTATION",      description: "所有进化建议必须可解释、可预览。",                                              severity: "MEDIUM" },
  { id: "ROLLBACKABLE",              description: "所有进化必须可回滚。",                                                          severity: "MEDIUM" },
  { id: "HIGH_RISK_REQUIRES_FOUNDER", description: "高风险 mutation 仅 Founder 可执行，并需要二次确认。",                          severity: "HIGH" },
  { id: "LOCAL_ONLY",                description: "进化记忆默认仅存在本地，不自动上传。",                                          severity: "HIGH" },
];

export const EVOLUTION_BOUNDARY_TEXT =
  "本地进化（Local Evolution）= 修改本地配置、推荐与显示顺序；代码进化（Code Evolution）= 必须通过 Code Generation Calculus 生成提示词、由用户复制到 Lovable/Codex 后确认执行。本系统不会自动改代码、不会自动上传数据。";
