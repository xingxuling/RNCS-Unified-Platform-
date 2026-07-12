import type { AetherConcept, AetherConceptChain, AetherConceptGraph } from "./webLcmTypes";

export interface WebLcmQaIssue {
  ruleId: string;
  severity: "INFO" | "WARN" | "CRITICAL";
  message: string;
}

export interface WebLcmQaReport {
  status: "PASSED" | "WARN" | "BLOCKED";
  issues: WebLcmQaIssue[];
  checkedAt: string;
}

export function runWebLcmQa(args: {
  concepts: AetherConcept[];
  chain?: AetherConceptChain;
  graph?: AetherConceptGraph;
}): WebLcmQaReport {
  const issues: WebLcmQaIssue[] = [];
  const { concepts, chain, graph } = args;
  if (concepts.length === 0) issues.push({ ruleId: "EMPTY_CONCEPTS", severity: "WARN", message: "未抽取到任何概念。" });
  const lowConf = concepts.filter(c => c.confidence < 0.4).length;
  if (lowConf > 0) issues.push({ ruleId: "LOW_CONFIDENCE", severity: "WARN", message: `${lowConf} 个概念置信度较低。` });
  if (chain && chain.orderedConcepts.length < 2) issues.push({ ruleId: "CHAIN_TOO_SHORT", severity: "INFO", message: "概念链过短，缺少转折点。" });
  if (graph && graph.edges.length === 0 && graph.nodes.length > 1) issues.push({ ruleId: "NO_RELATIONS", severity: "WARN", message: "概念图谱缺少关系边。" });
  for (const c of concepts) {
    if (c.summary && /full60|founder[_\s-]?only|api[_\s-]?key/i.test(c.summary)) {
      issues.push({ ruleId: "POSSIBLE_LEAK", severity: "CRITICAL", message: `概念 ${c.title} 可能包含敏感信息。` });
    }
  }
  const status: WebLcmQaReport["status"] = issues.some(i => i.severity === "CRITICAL")
    ? "BLOCKED"
    : issues.some(i => i.severity === "WARN") ? "WARN" : "PASSED";
  return { status, issues, checkedAt: new Date().toISOString() };
}
