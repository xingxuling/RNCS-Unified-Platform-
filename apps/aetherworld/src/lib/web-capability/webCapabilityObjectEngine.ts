import type { WebCapabilityModel, WebCapabilityOutput } from "./aetherWebCapabilityModels";

let counter = 0;
function nextId(prefix: string) { counter += 1; return `${prefix}-${Date.now().toString(36)}-${counter}`; }

export function buildCapabilityOutputs(model: WebCapabilityModel, userTask: string): WebCapabilityOutput[] {
  return model.outputTypes.slice(0, 3).map((t) => ({
    outputId: nextId("OUT"),
    outputType: t,
    title: `${model.chineseName} · ${t}`,
    summary: `基于任务「${userTask.slice(0, 60)}」生成的 ${t} 草案（仅供参考，未执行真实操作）。`,
    structuredOutput: {
      capabilityId: model.capabilityId,
      userTask,
      outline: defaultOutline(t),
      hint: "本对象为浏览器本地推理草案，需经 QA 与人工复核后方可投入生产。",
    },
    exportTargets: model.toolInterfaces,
    safetyNotes: [
      "禁止把草案当生产结果",
      "不得伪造来源或数据",
      "高风险领域只能作为辅助说明",
    ],
  }));
}

function defaultOutline(t: string): string[] {
  return [`${t}：背景`, `${t}：要点`, `${t}：交付物`, `${t}：风险与未决项`];
}
