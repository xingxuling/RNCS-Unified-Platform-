import { Badge } from "@/components/ui/badge";
import {
  GATE_GROUP_META,
  GATE_STATUS_META,
  type GateCheckItem,
} from "@/lib/versionIterationCalculus";

interface Props {
  items: GateCheckItem[];
}

export function ReleaseGateChecklist({ items }: Props) {
  const groups = Object.keys(GATE_GROUP_META) as GateCheckItem["group"][];
  const passCount = items.filter((i) => i.status === "PASS").length;
  const warnCount = items.filter((i) => i.status === "WARNING").length;
  const failCount = items.filter((i) => i.status === "FAIL").length;

  return (
    <div className="aether-card p-5 space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Release Gate Checklist
          </div>
          <h3 className="font-display text-xl mt-1">v1.0 发布闸口</h3>
          <p className="text-xs text-muted-foreground mt-1">
            出现任意 FAIL 项目时，不能标记为 v1.0。
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
            通过 {passCount}
          </Badge>
          <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/30">
            警告 {warnCount}
          </Badge>
          <Badge variant="outline" className="bg-rose-500/10 text-rose-300 border-rose-500/30">
            未通过 {failCount}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((g) => {
          const groupItems = items.filter((i) => i.group === g);
          if (groupItems.length === 0) return null;
          return (
            <div key={g} className="aether-card p-3 space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {GATE_GROUP_META[g].cn} · {GATE_GROUP_META[g].en}
              </div>
              <div className="space-y-1.5">
                {groupItems.map((it) => {
                  const sMeta = GATE_STATUS_META[it.status];
                  return (
                    <div key={it.id} className="flex items-center justify-between gap-2">
                      <span className="text-xs">{it.cn}</span>
                      <Badge variant="outline" className={`text-[10px] ${sMeta.tone}`}>
                        {sMeta.cn}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
