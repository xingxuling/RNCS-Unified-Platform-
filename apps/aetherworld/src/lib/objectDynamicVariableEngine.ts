import { resolveOntologyType } from "@/constants/objectOntologyTypes";

export interface DynamicVariable {
  name: string;
  currentState: string;
  influenceLevel: number; // 0-1
  direction: "UP" | "DOWN" | "STABLE" | "UNKNOWN";
}

export interface ObjectDynamicVariables {
  variables: DynamicVariable[];
  mostSensitiveVariable: string;
}

export function analyzeDynamicVariables(input: { description: string; typeId: string }): ObjectDynamicVariables {
  const t = resolveOntologyType(input.typeId);
  const text = input.description || "";
  const list = t.likelyDynamicVariables.length ? t.likelyDynamicVariables
    : ["用户理解度", "信任", "资源", "时间窗口", "外部反馈"];

  const variables: DynamicVariable[] = list.map(name => {
    const mentioned = text.includes(name);
    const up = new RegExp(`${name}[^。；\\n]*?(上升|增加|增长|更强)`).test(text);
    const down = new RegExp(`${name}[^。；\\n]*?(下降|减少|不足|更弱)`).test(text);
    return {
      name,
      currentState: mentioned ? "已被提及" : "未提及",
      influenceLevel: Number((mentioned ? 0.75 : 0.5).toFixed(2)),
      direction: up ? "UP" : down ? "DOWN" : mentioned ? "STABLE" : "UNKNOWN",
    };
  });
  const sensitive = variables.slice().sort((a, b) => b.influenceLevel - a.influenceLevel)[0];
  return { variables, mostSensitiveVariable: sensitive?.name ?? list[0] };
}
