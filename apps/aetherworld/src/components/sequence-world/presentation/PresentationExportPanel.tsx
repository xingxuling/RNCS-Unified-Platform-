import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { exportGodotPresentationPackage, generateGdScriptSkeleton } from "@/lib/sequence-world/presentation/godotPresentationExportEngine";
import { exportUnityPresentationPackage, generateUnityCSharpSkeleton } from "@/lib/sequence-world/presentation/unityPresentationExportEngine";
import { exportThreePresentationPackage } from "@/lib/sequence-world/presentation/threePresentationExportEngine";
import type { WorldPresentationResult } from "@/lib/sequence-world/presentation/worldPresentationRuntime";

type Target = "GENERIC" | "GODOT" | "UNITY" | "THREEJS" | "GDSCRIPT" | "CSHARP";

export function PresentationExportPanel({ presentation }: { presentation: WorldPresentationResult | null }) {
  const [target, setTarget] = useState<Target>("GENERIC");
  const text = useMemo(() => {
    if (!presentation) return "请先生成表现层。";
    switch (target) {
      case "GODOT": return JSON.stringify(exportGodotPresentationPackage(presentation), null, 2);
      case "UNITY": return JSON.stringify(exportUnityPresentationPackage(presentation), null, 2);
      case "THREEJS": return JSON.stringify(exportThreePresentationPackage(presentation), null, 2);
      case "GDSCRIPT": return generateGdScriptSkeleton();
      case "CSHARP": return generateUnityCSharpSkeleton();
      default: return JSON.stringify(presentation, null, 2);
    }
  }, [presentation, target]);

  const targets: Target[] = ["GENERIC", "GODOT", "UNITY", "THREEJS", "GDSCRIPT", "CSHARP"];

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">表现层导出 · Presentation Export</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-1 flex-wrap">
          {targets.map(t => (
            <Button key={t} size="sm" variant={target === t ? "default" : "outline"} onClick={() => setTarget(t)}>{t}</Button>
          ))}
        </div>
        {presentation?.subjectMode === "FULL_60" && (
          <div className="text-xs text-amber-500">⚠ Full60 表现层默认本地保存，导出前请确认隐私边界。</div>
        )}
        <Textarea readOnly value={text} rows={18} className="font-mono text-xs" />
      </CardContent>
    </Card>
  );
}
