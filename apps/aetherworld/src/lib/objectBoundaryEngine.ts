import { OBJECT_BOUNDARY_TYPES } from "@/constants/objectBoundaryTypes";
import { resolveOntologyType } from "@/constants/objectOntologyTypes";

export interface ObjectBoundary {
  innerBoundary: string[];
  outerBoundary: string[];
  allowedScope: string[];
  forbiddenScope: string[];
  boundaryRisk: string;
  boundaryByType: { typeId: string; name: string; hint: string; status: "明确" | "模糊" | "缺失" }[];
}

export function computeObjectBoundary(input: { name: string; description: string; typeId: string }): ObjectBoundary {
  const t = resolveOntologyType(input.typeId);
  const text = input.description || "";

  const allowedScope = matches(text, /(可以|允许|支持)[^。；\n]{0,30}/g);
  const forbiddenScope = matches(text, /(不可|禁止|不允许|避免)[^。；\n]{0,30}/g);

  const inner = [`核心保留：${t.likelyInvariants.slice(0, 2).join("、") || "待定义"}`];
  const outer = [`外部接口：与其它模块以输入/输出对接，不直接覆盖`];

  const byType = OBJECT_BOUNDARY_TYPES.map(b => ({
    typeId: b.id,
    name: b.name,
    hint: b.hint,
    status: (text.includes(b.name) ? "明确" : allowedScope.length || forbiddenScope.length ? "模糊" : "缺失") as "明确" | "模糊" | "缺失",
  }));

  const missing = byType.filter(b => b.status === "缺失").length;
  const risk = missing >= 6 ? "高：边界严重缺失"
    : missing >= 3 ? "中：部分边界缺失"
    : "低：基本边界完整";

  return {
    innerBoundary: inner,
    outerBoundary: outer,
    allowedScope: allowedScope.length ? allowedScope : ["允许范围待明确"],
    forbiddenScope: forbiddenScope.length ? forbiddenScope : ["禁止范围待明确"],
    boundaryRisk: risk,
    boundaryByType: byType,
  };
}

function matches(s: string, re: RegExp) { return (s.match(re) || []).map(x => x.trim()).slice(0, 6); }
