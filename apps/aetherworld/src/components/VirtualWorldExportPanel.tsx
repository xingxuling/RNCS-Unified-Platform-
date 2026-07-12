import { useState } from "react";
import type { VirtualWorldState } from "@/lib/virtualWorldEngine";
import { compileWorldNarrative } from "@/lib/worldNarrativeCompiler";
import { WORLD_SAFETY_TEXT } from "@/constants/worldSafetyRules";
import { Button } from "@/components/ui/button";
import { Copy, Download, FileJson, FileText } from "lucide-react";
import { toast } from "sonner";

export function VirtualWorldExportPanel({ state }: { state: VirtualWorldState }) {
  const [tab, setTab] = useState<"markdown" | "json" | "xhs" | "godot">("markdown");
  const report = compileWorldNarrative(state);

  const markdown = `# ${state.worldName}
> 模式：${state.worldMode} · 种子 ${state.seed.seedSignature}

## 角色
${report.characterSummary}

## 世界法则
${state.worldLaws.map(l => `- **${l.userFriendlyName}**：${l.explanation}`).join("\n")}

## 地图
${state.zones.map(z => `- ${z.zoneName} [${z.state}] LV${z.level}`).join("\n")}

## 当前任务
${state.quests.slice(0, 6).map(q => `- ${q.title}（${q.questType}）`).join("\n")}

## 下一步
${report.nextAction}

---
${WORLD_SAFETY_TEXT}`;

  const xhs = `🌌 我用 Aether Fate Engine 生成了我的虚拟世界
世界名：${state.worldName}
角色：${state.character.className}
当前主线：${state.quests[0]?.title ?? "未生成"}
下一步建议：${report.nextAction}

#个人世界 #虚拟世界 #预测系统
${WORLD_SAFETY_TEXT}`;

  const godot = `# Godot Prototype Prompt
World: ${state.worldName}
Seed: ${state.seed.seedSignature}
Zones: ${state.zones.map(z => z.enName).join(", ")}
Quests: ${state.quests.length}
NPCs: ${state.npcs.length}

任务：将上述结构生成为 Godot 4.x 原型，地图用 TileMap，NPC 用 Area2D，任务用 Resource。
${WORLD_SAFETY_TEXT}`;

  const text = tab === "markdown" ? markdown
    : tab === "json" ? JSON.stringify(state, null, 2)
    : tab === "xhs" ? xhs : godot;

  const copy = () => { navigator.clipboard.writeText(text); toast.success("已复制"); };
  const download = () => {
    const ext = tab === "json" ? "json" : tab === "markdown" ? "md" : "txt";
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${state.worldName}.${ext}`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="aether-card-elevated p-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Export · 导出</div>
      <div className="flex gap-2 mt-3 flex-wrap">
        {(["markdown", "json", "xhs", "godot"] as const).map(t => (
          <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)}>
            {t === "markdown" ? <><FileText className="w-3.5 h-3.5 mr-1" />Markdown</>
              : t === "json" ? <><FileJson className="w-3.5 h-3.5 mr-1" />JSON</>
              : t === "xhs" ? "小红书文案" : "Godot 提示词"}
          </Button>
        ))}
      </div>
      <pre className="mt-3 max-h-72 overflow-auto text-[11px] bg-background/40 p-3 rounded border border-border whitespace-pre-wrap">
{text}
      </pre>
      <div className="flex gap-2 mt-3">
        <Button size="sm" variant="outline" onClick={copy}><Copy className="w-3.5 h-3.5 mr-1" />复制</Button>
        <Button size="sm" variant="outline" onClick={download}><Download className="w-3.5 h-3.5 mr-1" />下载</Button>
      </div>
    </div>
  );
}
