import { useState } from "react";
import { simulateRelations, type SimulatedSubject } from "@/lib/sequence-world/simulation/multiSubjectSimulator";

export function MultiSubjectSimulatorPanel({ initialSubjects, dominantDigits }: { initialSubjects?: SimulatedSubject[]; dominantDigits?: string[] }) {
  const [subjects] = useState<SimulatedSubject[]>(initialSubjects ?? [
    { id: "user",   name: "用户",     subjectType: "USER",   role: "主角", currentGoal: "推进世界", trust: 0.6, conflict: 0.1, agency: 0.8 },
    { id: "elder",  name: "归元长者", subjectType: "NPC",    role: "导师", currentGoal: "守护秩序", trust: 0.5, conflict: 0.1, agency: 0.5 },
    { id: "rebel",  name: "边境异客", subjectType: "NPC",    role: "对手", currentGoal: "打破规则", trust: 0.2, conflict: 0.6, agency: 0.6 },
    { id: "faction-wind", name: "风之阵营", subjectType: "FACTION", role: "中立", currentGoal: "贸易", trust: 0.4, conflict: 0.2, agency: 0.4 },
  ]);
  const r = simulateRelations(subjects, dominantDigits ?? ["5", "2"]);
  return (
    <div className="aether-card p-4 space-y-2">
      <h3 className="font-display gold-text">多主体模拟</h3>
      <div className="text-xs">
        <div><span className="text-muted-foreground">联盟：</span>{r.alliances.join("； ") || "—"}</div>
        <div><span className="text-muted-foreground">冲突：</span>{r.conflicts.join("； ") || "—"}</div>
        <div><span className="text-muted-foreground">即将互动：</span>{r.likelyEncounters.join("； ") || "—"}</div>
        <div className="mt-2 text-foreground">下一步建议：{r.nextInteractionSuggestion}</div>
      </div>
    </div>
  );
}
