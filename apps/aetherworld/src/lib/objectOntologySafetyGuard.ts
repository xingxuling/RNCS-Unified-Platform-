import { FORBIDDEN_PATTERNS, OBJECT_ONTOLOGY_SAFETY_RULES, RECOMMENDED_PHRASING } from "@/constants/objectOntologySafetyRules";

export interface OntologySafetyFinding {
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
  suggestion?: string;
}

export function checkOntologySafety(text: string): OntologySafetyFinding[] {
  const findings: OntologySafetyFinding[] = [];
  for (const re of FORBIDDEN_PATTERNS) {
    if (re.test(text)) {
      findings.push({
        severity: "HIGH",
        message: `输出包含绝对化表达：${re.source}`,
        suggestion: `改为：${RECOMMENDED_PHRASING[0]}`,
      });
    }
  }
  return findings;
}

export const ONTOLOGY_SAFETY_NOTE = OBJECT_ONTOLOGY_SAFETY_RULES.join("\n");
export { RECOMMENDED_PHRASING };
