import { resolveOntologyType } from "@/constants/objectOntologyTypes";

export interface MislabelingResult {
  currentName: string;
  isMislabeling: boolean;
  betterNames: string[];
  why: string;
}

export function detectMislabeling(input: { name: string; description: string; typeId: string }): MislabelingResult {
  const t = resolveOntologyType(input.typeId);
  const name = input.name || "";
  const text = input.description || "";

  const labelLikeNames = ["算命", "玄学", "占卜", "AI 万能", "万能工具", "魔法", "巫术"];
  const hit = labelLikeNames.find(l => name.includes(l) || text.includes(l));

  if (hit) {
    return {
      currentName: name,
      isMislabeling: true,
      betterNames: [
        `${t.userFriendlyName} · 结构预测`,
        `${t.userFriendlyName} · 行动许可引擎`,
        `${t.userFriendlyName} · 现实问题拆解器`,
      ],
      why: `命名「${hit}」容易误导用户期望，建议更换为反映其结构功能的名称。`,
    };
  }

  const commonMis = t.commonMislabels.find(m => name.includes(m) || text.includes(m));
  if (commonMis) {
    return {
      currentName: name,
      isMislabeling: true,
      betterNames: [`${t.userFriendlyName}（基于其核心功能命名）`],
      why: `当前命名属于该类型的常见误命名：${commonMis}`,
    };
  }
  return {
    currentName: name,
    isMislabeling: false,
    betterNames: [],
    why: "当前命名未发现明显误命名风险。",
  };
}
