// Constitutional Rule Engine
import { CONSTITUTION_REGISTRY, getArticle } from "./constitutionRegistry";
import { ENGINE_OBLIGATIONS } from "@/constants/constitution/engineObligations";

export { ENGINE_OBLIGATIONS };

export function getMandatoryArticlesForEngine(engineId: string): string[] {
  const ob = ENGINE_OBLIGATIONS.find((e) => e.engineId === engineId);
  return ob?.mustCheckArticles ?? [];
}

export function listFounderLockedArticles() {
  return CONSTITUTION_REGISTRY.filter((a) => a.founderLocked);
}

export function listCriticalArticles() {
  return CONSTITUTION_REGISTRY.filter((a) => a.violationSeverity === "CRITICAL");
}

export { getArticle };
