import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Download, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import {
  exportGenericJSON, exportMarkdownReport, exportPromptForge, checkExportSafety,
  type SequenceWorldExport,
} from "@/lib/sequence-world/engineExportAdapter";
import { exportGodotJSON, exportGodotGDScriptSkeleton } from "@/lib/sequence-world/godotExportAdapter";
import { exportUnityJSON, exportUnityCSharpSkeleton } from "@/lib/sequence-world/unityExportAdapter";

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 800);
}

function copy(text: string, label: string) {
  navigator.clipboard.writeText(text);
  toast.success(`已复制 ${label}`);
}

export function EngineExportPanel({ world }: { world: SequenceWorldExport }) {
  const generic = useMemo(() => exportGenericJSON(world), [world]);
  const godot = useMemo(() => exportGodotJSON(world), [world]);
  const unity = useMemo(() => exportUnityJSON(world), [world]);
  const unityCS = useMemo(() => exportUnityCSharpSkeleton(world), [world]);
  const godotGD = useMemo(() => exportGodotGDScriptSkeleton(world), [world]);
  const markdown = useMemo(() => exportMarkdownReport(world), [world]);
  const promptText = useMemo(() => exportPromptForge(world), [world]);
  const safety = useMemo(() => checkExportSafety(world, generic + markdown + promptText), [world, generic, markdown, promptText]);

  const TARGETS: Array<{ key: string; label: string; text: string; filename: string }> = [
    { key: "generic", label: "通用 JSON", text: generic, filename: "sequence_world_profile.json" },
    { key: "godot", label: "Godot JSON (snake_case)", text: godot, filename: "sequence_world_profile.godot.json" },
    { key: "unity", label: "Unity JSON (camelCase)", text: unity, filename: "sequence_world_profile.unity.json" },
    { key: "unityCS", label: "Unity C# Skeleton", text: unityCS, filename: "SequenceWorldLoader.cs" },
    { key: "godotGD", label: "Godot GDScript Skeleton", text: godotGD, filename: "sequence_world_loader.gd" },
    { key: "markdown", label: "Markdown Report", text: markdown, filename: "sequence_world_report.md" },
    { key: "prompt", label: "Prompt Forge", text: promptText, filename: "sequence_world_prompt.txt" },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Engine Export · 引擎导出
            <Badge variant="outline">v{world.metadata.engineVersion}</Badge>
          </CardTitle>
          <CardDescription>面向 Unity / Godot / Three.js / Prompt 的多目标导出。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {TARGETS.map(t => (
            <div key={t.key} className="rounded-md border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">{t.label}</div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => copy(t.text, t.label)}>
                    <Copy className="w-3 h-3 mr-1" /> 复制
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => download(t.filename, t.text)}>
                    <Download className="w-3 h-3 mr-1" /> 下载
                  </Button>
                </div>
              </div>
              <Textarea readOnly value={t.text.length > 4000 ? t.text.slice(0, 4000) + "\n…(截断预览)" : t.text} rows={8} className="font-mono text-[11px]" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500" /> Safety & QA 检查
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex gap-2">
            <Badge variant={safety.passed ? "secondary" : "destructive"}>
              {safety.passed ? "Passed" : "Has Critical Violations"}
            </Badge>
            <Badge variant="outline">违规 {safety.violations.length}</Badge>
          </div>
          {safety.violations.length === 0 ? (
            <p className="text-xs text-muted-foreground">未发现违规。</p>
          ) : (
            <ul className="text-xs space-y-1">
              {safety.violations.map((v, i) => (
                <li key={i} className="flex gap-2">
                  <Badge variant="outline" className="shrink-0">{v.severity}</Badge>
                  <span>{v.message}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground mb-1">推荐声明</div>
            <ul className="text-xs space-y-0.5 list-disc list-inside">
              {safety.disclaimers.map(d => <li key={d}>{d}</li>)}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
