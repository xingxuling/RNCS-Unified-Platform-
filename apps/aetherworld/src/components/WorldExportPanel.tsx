import { useState } from "react";
import { Copy, FileJson, FileText, Share2, Wand2 } from "lucide-react";
import type { PersonalWorldResult } from "@/lib/personalWorldCalculus";
import { exportWorldJSON, exportWorldMarkdown, exportXiaohongshu } from "@/lib/worldGenerationEngine";

export function WorldExportPanel({ result }: { result: PersonalWorldResult }) {
  const [hint, setHint] = useState("");

  const copy = async (text: string, label: string) => {
    try { await navigator.clipboard.writeText(text); setHint(`${label} 已复制`); }
    catch { setHint("复制失败，请手动复制。"); }
    setTimeout(() => setHint(""), 2200);
  };

  const promptForge = `请基于以下个人世界报告，给出 7 天内可以执行的 3 个小步行动，并为每个行动写一段可直接复用的执行提示词。\n\n${exportWorldMarkdown(result)}`;

  return (
    <div className="aether-card p-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Export · 导出</div>
      <h3 className="font-display text-lg mt-1">导出你的个人世界</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
        <Btn icon={<Copy className="w-3.5 h-3.5" />} label="复制报告" onClick={() => copy(exportWorldMarkdown(result), "Markdown 报告")} />
        <Btn icon={<FileText className="w-3.5 h-3.5" />} label="导出 Markdown" onClick={() => download(`${result.worldName}.md`, exportWorldMarkdown(result))} />
        <Btn icon={<FileJson className="w-3.5 h-3.5" />} label="导出 JSON" onClick={() => download(`${result.worldName}.json`, exportWorldJSON(result))} />
        <Btn icon={<Share2 className="w-3.5 h-3.5" />} label="小红书文案" onClick={() => copy(exportXiaohongshu(result), "小红书文案")} />
        <Btn icon={<Wand2 className="w-3.5 h-3.5" />} label="Prompt Forge" onClick={() => copy(promptForge, "提示词")} />
      </div>
      <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
        导出内容会自动附带安全说明：本报告为结构性象征模型，不代表绝对命运。
      </p>
      {hint && <div className="mt-2 text-xs text-primary">{hint}</div>}
    </div>
  );
}

function Btn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-2 text-xs px-3 py-2 rounded-md border border-border hover:border-primary/50 hover:bg-primary/5 transition">
      {icon}<span>{label}</span>
    </button>
  );
}

function download(name: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
