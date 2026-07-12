import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { extractRealityVariables } from "@/lib/reality-data/realityVariableExtractor";

export function RealityVariablePanel() {
  const [text, setText] = useState("2025 年香港大学排名第 30 位，市场情况持续变化。");
  const vars = extractRealityVariables({ sourceId: "preview", content: text, freshnessLevel: "FRESH", credibilityLevel: "MEDIUM" });
  return (
    <Card className="p-4 space-y-3">
      <div className="text-sm font-medium">现实变量提取</div>
      <Input value={text} onChange={(e) => setText(e.target.value)} />
      <Button variant="outline" size="sm" onClick={() => setText(text + " ")}>重新提取</Button>
      <div className="space-y-1 text-xs">
        {vars.map((v) => (
          <div key={v.variableId} className="flex justify-between border-b py-1">
            <span className="font-medium">{v.name}</span>
            <span className="text-muted-foreground">{v.variableType}</span>
            <span>{String(v.value)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
