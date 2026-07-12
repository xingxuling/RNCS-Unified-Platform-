import type { WebCapabilityModel, WebCapabilityProcedureStep } from "./aetherWebCapabilityModels";

export interface ProcedureStepRun {
  stepId: string;
  type: WebCapabilityProcedureStep["type"];
  title: string;
  status: "DONE" | "SKIPPED" | "BLOCKED";
  note: string;
}

export function runCapabilityProcedure(model: WebCapabilityModel, userTask: string, blocked: boolean): ProcedureStepRun[] {
  return model.procedureSteps.map((s) => {
    if (blocked) return { stepId: s.stepId, type: s.type, title: s.title, status: "BLOCKED", note: "由 Safety Guard 阻断" };
    const note = synthesizeNote(s, userTask, model);
    return { stepId: s.stepId, type: s.type, title: s.title, status: "DONE", note };
  });
}

function synthesizeNote(s: WebCapabilityProcedureStep, task: string, model: WebCapabilityModel): string {
  switch (s.type) {
    case "RETRIEVE_KNOWLEDGE":   return `WebLKM 命中知识源：${model.requiredKnowledgeSources.join("、") || "（无）"}`;
    case "SELECT_CALCULUS":      return `WebCM 选定计算法：${model.requiredCalculusIds.join("、") || "（无）"}`;
    case "INJECT_CONSTANTS":     return `WebCoM 注入常数：${model.requiredConstants.join("、") || "（无）"}`;
    case "BUILD_CONCEPT_CHAIN":  return `WebLCM 基于任务「${task.slice(0, 40)}」生成概念链。`;
    case "RUN_TOOL_INTERFACE":   return `工具接口：${model.toolInterfaces.join(" → ")}`;
    case "EXPAND_WITH_WEBLLM":   return `WebLLM 本地展开（无 WebGPU 时回退到规则模板）。`;
    case "PRODUCE_OUTPUT_OBJECT":return `生成输出对象：${model.outputTypes.join("、")}`;
    case "RUN_QA":               return `调用 QA 规则：${model.qaRules.join("、")}`;
    case "SAVE_WORKSPACE":       return `写入 Workspace（${model.workspaceObjectTypes.join("、")}）`;
  }
}
