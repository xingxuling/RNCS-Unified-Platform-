// Cross-domain calculus transfer (e.g. App Runtime ↔ Code Sandbox)
export interface TransferSuggestion { fromId: string; toId: string; bridge: string; }
const PAIRS: TransferSuggestion[] = [
  { fromId: "APP_RUNTIME_CALCULUS", toId: "CODE_SANDBOX_CALCULUS", bridge: "App → 代码草案 → 沙箱运行" },
  { fromId: "CODE_SANDBOX_CALCULUS", toId: "SOFTWARE_QA", bridge: "运行结果 → QA 检查" },
  { fromId: "WORLD_ENGINE_CALCULUS", toId: "VOCAL_ENGINE_CALCULUS", bridge: "世界主题 → 世界主题曲" },
  { fromId: "NARRATIVE_ENGINE_CALCULUS", toId: "VOCAL_ENGINE_CALCULUS", bridge: "剧情情绪 → 歌词" },
];
export function suggestTransfer(ids: string[]): TransferSuggestion[] {
  return PAIRS.filter((p) => ids.includes(p.fromId));
}
