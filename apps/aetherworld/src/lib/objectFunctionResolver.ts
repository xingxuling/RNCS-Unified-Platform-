import { resolveOntologyType } from "@/constants/objectOntologyTypes";

export interface ObjectFunction {
  surfaceFunction: string;
  deepFunction: string;
  mistakenFunction: string[];
  latentFunction: string[];
}

export function resolveObjectFunction(input: { name: string; description: string; typeId: string }): ObjectFunction {
  const t = resolveOntologyType(input.typeId);
  const text = input.description || "";
  const surface = (text.match(/(?:用于|功能是|作用是)[^。；\n]{0,40}/) || [])[0] || `${input.name || "对象"}的表层功能待补充`;
  const deep = `${input.name || "对象"}在「${t.userFriendlyName}」层面的深层功能：承担其核心不变量所定义的角色`;
  return {
    surfaceFunction: surface,
    deepFunction: deep,
    mistakenFunction: t.commonMislabels.map(m => `常被误认为：${m}`),
    latentFunction: t.bestNextEngines.map(e => `潜在可接入：${e}`),
  };
}
