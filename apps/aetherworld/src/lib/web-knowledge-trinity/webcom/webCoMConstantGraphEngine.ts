import { listConstants } from "./webCoMConstantIndexer";
export interface ConstantGraphEdge { from: string; to: string; relation: string; }
export function buildConstantGraph(): { nodes: { id: string; label: string }[]; edges: ConstantGraphEdge[] } {
  const cs = listConstants();
  const nodes = cs.map((c) => ({ id: c.constantId, label: c.chineseName }));
  const edges: ConstantGraphEdge[] = [];
  // simple priority-based dependencies
  cs.forEach((c) => {
    c.appliesTo.forEach((a) => {
      edges.push({ from: c.constantId, to: a, relation: "APPLIES_TO" });
    });
  });
  return { nodes, edges };
}
