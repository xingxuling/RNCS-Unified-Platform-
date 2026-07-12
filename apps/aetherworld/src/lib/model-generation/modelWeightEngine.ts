import type { ModelTypeDefinition } from "@/constants/model-generation/modelTypes";

export interface ModelWeight {
  name: string;
  description: string;
  value: number;
  source: string;
  adjustable: boolean;
}

export function generateWeights(modelType: string, def?: ModelTypeDefinition): ModelWeight[] {
  const names = def?.defaultWeights ?? ["重要性", "可验证性", "稳定性"];
  const equalShare = +(1 / names.length).toFixed(3);
  return names.map(n => ({
    name: n,
    description: `${modelType} 默认权重项：${n}`,
    value: equalShare,
    source: "DEFAULT_TEMPLATE",
    adjustable: true,
  }));
}
