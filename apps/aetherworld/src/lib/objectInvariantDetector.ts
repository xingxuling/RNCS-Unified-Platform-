import { resolveOntologyType } from "@/constants/objectOntologyTypes";

export interface ObjectInvariants {
  primaryInvariants: string[];
  secondaryInvariants: string[];
  ifLostThen: string;
}

export function detectInvariants(input: { name: string; description: string; typeId: string }): ObjectInvariants {
  const t = resolveOntologyType(input.typeId);
  const text = input.description || "";
  const userClaims = (text.match(/(?:核心|关键|必须|不变)[^。；\n]{0,30}/g) || []).slice(0, 4);

  const primary = userClaims.length ? userClaims : t.likelyInvariants.slice(0, 3);
  const secondary = t.likelyInvariants.slice(3);

  return {
    primaryInvariants: primary,
    secondaryInvariants: secondary,
    ifLostThen: `若失去核心不变量，${input.name || "该对象"}将退化为另一类对象，本体不再成立。`,
  };
}
