import { getScope, type VersionImpactScopeId } from "@/constants/version-leap/versionImpactScopes";
import { getChangeTypeMeta, type VersionChangeType } from "@/constants/version-leap/versionChangeTypes";

export interface ImpactBreakdown {
  scopeId: VersionImpactScopeId;
  weight: number;
  reasons: string[];
}

export function analyzeImpact(
  changeTypes: VersionChangeType[],
  affectedScopes: VersionImpactScopeId[],
): ImpactBreakdown[] {
  const map = new Map<VersionImpactScopeId, ImpactBreakdown>();
  affectedScopes.forEach((sid) => {
    const sc = getScope(sid);
    if (!sc) return;
    map.set(sid, { scopeId: sid, weight: sc.weight, reasons: [`scope:${sc.name}`] });
  });
  changeTypes.forEach((ct) => {
    const meta = getChangeTypeMeta(ct);
    if (!meta) return;
    meta.baseScope.forEach((sid) => {
      const id = sid as VersionImpactScopeId;
      const sc = getScope(id);
      if (!sc) return;
      const existing = map.get(id);
      if (existing) existing.reasons.push(`change:${meta.label}`);
      else map.set(id, { scopeId: id, weight: sc.weight, reasons: [`change:${meta.label}`] });
    });
  });
  return Array.from(map.values()).sort((a, b) => b.weight - a.weight);
}

export function impactSummary(breakdown: ImpactBreakdown[]): { totalWeight: number; scopeCount: number } {
  return {
    totalWeight: breakdown.reduce((sum, b) => sum + b.weight, 0),
    scopeCount: breakdown.length,
  };
}
