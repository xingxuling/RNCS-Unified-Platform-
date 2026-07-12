import { getRecentObjects } from "@/lib/command-canvas/recentObjectsEngine";
import type { CanvasObjectRef } from "@/lib/command-canvas/canvasObjectResolver";

interface Props {
  selectedObjectId?: string;
  onSelect?: (id: string) => void;
}

const CANVAS_BLOCKS: Record<string, string[]> = {
  APP_PROJECT_OBJECT: ["Requirement", "Architecture", "File Tree", "Code Draft", "Preview", "QA", "Handoff"],
  CODE_RUN_RESULT_OBJECT: ["Run Logs", "Errors", "Repair Suggestions", "Patch Drafts", "QA"],
  WEBLWM_WORLD_OBJECT: ["World State", "Rules", "Entities", "Regions", "Events", "Timeline", "Causality"],
  WEBLCM_CONCEPT_GRAPH_OBJECT: ["Concept Nodes", "Concept Edges", "Chain", "Prediction", "Expansion"],
  WEB_KNOWLEDGE_TRINITY_RUN_OBJECT: ["WebLKM Knowledge", "WebCM Route", "WebCoM Constants", "WebLCM Chain", "WebLLM Prompt", "QA"],
  WEB_CAPABILITY_RUN_OBJECT: ["Selected WebXXM", "Knowledge", "Calculus", "Constants", "Concept Chain", "Output", "QA"],
  SONG_OBJECT: ["Lyrics", "Vocal Direction", "Style", "Prompt", "QA"],
  STORY_OBJECT: ["Outline", "Scenes", "Characters", "Canon Notes", "QA"],
  GENERIC_OBJECT: ["Summary", "Raw"],
};

export function AetherCanvasWorkspace({ selectedObjectId, onSelect }: Props) {
  const recent = getRecentObjects();
  const obj: CanvasObjectRef | undefined =
    recent.find((r) => r.id === selectedObjectId) ?? recent[0];

  return (
    <div className="flex h-full min-h-[420px] flex-col gap-3 rounded-lg border border-border/50 bg-card/30 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium">画布工作区 · Canvas Workspace</h2>
          {obj && (
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {obj.type} · {obj.id}
            </div>
          )}
        </div>
        {recent.length > 0 && (
          <select
            value={obj?.id ?? ""}
            onChange={(e) => onSelect?.(e.target.value)}
            className="rounded-md border border-border/40 bg-background/60 px-2 py-1 text-xs"
          >
            {recent.map((r) => (
              <option key={r.id} value={r.id}>{r.title}</option>
            ))}
          </select>
        )}
      </div>

      {!obj && (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          画布暂未加载对象。请在 Command Center 输入命令，或在能力坞调用任意 WebXXM。
        </div>
      )}

      {obj && (
        <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2">
          {(CANVAS_BLOCKS[obj.type] ?? CANVAS_BLOCKS.GENERIC_OBJECT).map((block) => (
            <div key={block} className="rounded-md border border-border/40 bg-background/50 p-3 text-xs">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{block}</div>
              <div className="mt-2 text-foreground/80">
                {block === "Summary" ? (obj.summary ?? obj.title) : `${block} 区块占位 · 来自 ${obj.type}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
