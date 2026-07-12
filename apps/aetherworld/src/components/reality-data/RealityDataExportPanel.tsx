import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { exportRealityData } from "@/lib/reality-data/realityDataExportEngine";

export function RealityDataExportPanel() {
  const [out, setOut] = useState("");
  return (
    <Card className="p-4 space-y-3">
      <div className="text-sm font-medium">导出现实数据</div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => setOut(exportRealityData("markdown"))}>Markdown</Button>
        <Button size="sm" variant="outline" onClick={() => setOut(exportRealityData("json"))}>JSON</Button>
      </div>
      {out && <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-80">{out}</pre>}
    </Card>
  );
}
