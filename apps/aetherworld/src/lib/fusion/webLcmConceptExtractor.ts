// 轻量 WebLCM 概念抽取器：纯启发式，无模型依赖。
// 在真实 WebLCM 模型化前，先把概念图先跑起来。
import type { ConceptEdge, ConceptNode, ConceptNodeType, WebLcmConceptGraph } from "./fusionTypes";

interface Pattern {
  match: RegExp;
  type: ConceptNodeType;
  label?: string;
}

const PATTERNS: Pattern[] = [
  { match: /(应用|app|网页应用)/i, type: "OUTPUT", label: "App" },
  { match: /(番茄钟|计时器|笔记|计算器|看板)/, type: "OBJECT" },
  { match: /(歌|歌曲|主题曲|配乐|旋律)/, type: "OUTPUT", label: "歌曲" },
  { match: /(歌词|文案|剧情|故事|文本)/, type: "OUTPUT" },
  { match: /(世界|蓝天机|宇宙|场域)/, type: "DOMAIN" },
  { match: /(代码|脚本|函数|组件|patch|修复)/i, type: "OUTPUT" },
  { match: /(保存|创建|生成|发布|分享|提醒|检查|检测|安装|启用)/, type: "ACTION" },
  { match: /(工作区|workspace|沙箱|sandbox|商店|store|社交|social|日历|calendar)/i, type: "TOOL" },
  { match: /(用户|我|创作者|学习者|团队|听众|受众)/, type: "ROLE" },
  { match: /(明天|今晚|下周|周一|周二|周三|周四|周五|周六|周日|早上|下午|晚上)/, type: "TIME" },
  { match: /(QA|风险|安全|宪法|权限)/, type: "RISK" },
  { match: /(意义|价值|主线|信念)/, type: "VALUE" },
];

function uid(prefix: string, i: number): string {
  return `${prefix}_${i}`;
}

export function extractWebLcmConceptGraph(raw: string): WebLcmConceptGraph {
  const text = raw.trim();
  const nodes: ConceptNode[] = [];
  const seen = new Set<string>();

  PATTERNS.forEach((p, idx) => {
    const m = text.match(p.match);
    if (m) {
      const label = (p.label || m[0]).trim();
      const key = `${p.type}:${label.toLowerCase()}`;
      if (seen.has(key)) return;
      seen.add(key);
      nodes.push({
        id: uid("n", nodes.length + 1),
        label,
        type: p.type,
        weight: Math.min(1, 0.4 + idx * 0.02 + label.length * 0.02),
      });
    }
  });

  // 至少给一个 OBJECT 节点兜底
  if (nodes.length === 0) {
    nodes.push({
      id: "n_1",
      label: text.slice(0, 12) || "未知主题",
      type: "OBJECT",
      weight: 0.3,
    });
  }

  // 简单关系：ACTION → OUTPUT / OBJECT / TOOL
  const edges: ConceptEdge[] = [];
  const actions = nodes.filter((n) => n.type === "ACTION");
  const targets = nodes.filter((n) =>
    n.type === "OUTPUT" || n.type === "OBJECT" || n.type === "TOOL",
  );
  actions.forEach((a) => {
    targets.forEach((t) => {
      edges.push({ from: a.id, to: t.id, relation: "TARGET", weight: 0.5 });
    });
  });

  const summary = `识别 ${nodes.length} 个概念节点，${edges.length} 条关系。`;
  const confidence = Math.min(1, 0.3 + nodes.length * 0.08);

  return { nodes, edges, summary, confidence };
}
