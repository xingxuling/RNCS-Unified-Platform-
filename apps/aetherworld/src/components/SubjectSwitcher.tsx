import { useAetherData } from "@/lib/useAetherData";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export function SubjectSwitcher() {
  const { subjects, active, switchSubject } = useAetherData();
  if (!active) return null;
  return (
    <div className="flex items-center gap-3">
      <Select value={active.id} onValueChange={switchSubject}>
        <SelectTrigger className="h-9 min-w-[220px] bg-card/60 border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {subjects.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              <div className="flex items-center gap-2">
                <span>{s.codeName ? `${s.codeName} · ${s.name}` : s.name}</span>
                {s.isDemo && (
                  <span className="text-[10px] text-primary/80 border border-primary/30 rounded px-1.5 py-px">
                    DEMO
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {active.isDemo && (
        <Badge variant="outline" className="border-primary/30 text-primary/90 text-[10px]">
          模拟主体 · 不代表真实命运
        </Badge>
      )}
    </div>
  );
}
