// Bridge Planner：为没有 bridgePlan 的模块生成默认计划，并提供 Lovable 提示词草案。
import type { LegacyModule, LegacyBridgePlan } from "./legacyModuleTypes";

export function getOrBuildBridgePlan(module: LegacyModule): LegacyBridgePlan {
  if (module.bridgePlan) return module.bridgePlan;

  const targets: string[] = [];
  if (module.connectableTo.chat) targets.push("Chat");
  if (module.connectableTo.fusion) targets.push("Fusion Runtime");
  if (module.connectableTo.memory) targets.push("Sequence Memory");
  if (module.connectableTo.currency) targets.push("Sequence Currency");
  if (module.connectableTo.msl) targets.push("MSL State");
  if (module.connectableTo.prediction) targets.push("Prediction");
  if (module.connectableTo.scheduler) targets.push("Scheduler");
  if (module.connectableTo.calendar) targets.push("Calendar Trigger");
  if (module.connectableTo.workspace) targets.push("Workspace");
  if (module.connectableTo.store) targets.push("Store / WebXXM");
  if (module.connectableTo.social) targets.push("Social");
  if (module.connectableTo.qa) targets.push("QA Audit");

  return {
    goal: `把「${module.cnName}」接入 Aetherworld 新运行链`,
    targets,
    reusableFiles: module.files,
    newBridges: [`${module.id.toLowerCase()}-bridge.ts`],
    risks: module.risks.length > 0 ? module.risks : ["接入过程需保持只读优先，避免破坏既有页面"],
    promptDraft: `请把「${module.cnName}」(${module.routes.join(", ") || "无路由"}) 接入以下系统：${targets.join("、")}。仅做 Bridge，不重写业务页面。`,
  };
}
