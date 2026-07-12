// 计算法骨架式 Fallback：当模型不可用时，按命中的计算法生成结构化空答骨架，
// 而不是只回"输入识别：ASK_EXPLANATION"。
import type { CalculusRoute } from "./calculusRouteResultTypes";
import { CALCULUS_LABEL } from "./calculusRouteResultTypes";
import { CALCULUS_REGISTRY } from "./calculusRouteRegistry";

export function buildCalculusFallbackAnswer(raw: string, route: CalculusRoute): string {
  if (!route.calculusIds.length) {
    return [
      "本地模型暂不可用，已切换为规则 / 计算法骨架模式。",
      "",
      `· 原始问题：${raw}`,
      "· 未命中具体计算法，将给出通用结构化回答。",
      "",
      "建议下一步：补充更具体的目标（应用 / 代码 / 世界 / 歌曲 / 数列 / 提醒 / 发布）。",
    ].join("\n");
  }

  const lines: string[] = [];
  lines.push(`本地模型暂不可用，已使用「计算法骨架」模式生成结构化回答。`);
  lines.push("");
  lines.push(`命中计算法：${route.calculusIds.map((id) => CALCULUS_LABEL[id]).join(" → ")}`);
  lines.push(`原因：${route.routeReason}`);
  lines.push("");
  route.calculusIds.forEach((id) => {
    const def = CALCULUS_REGISTRY[id];
    lines.push(`## ${CALCULUS_LABEL[id]}`);
    def.requiredSections.forEach((s) => {
      lines.push(`### ${s}`);
      lines.push("（待模型补全 / 可手动填写）");
    });
    lines.push("");
  });
  if (route.nextActions.length) {
    lines.push("下一步可执行：");
    route.nextActions.forEach((a) => lines.push(`- ${a}`));
  }
  return lines.join("\n");
}
