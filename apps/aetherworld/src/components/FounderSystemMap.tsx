import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FOUNDER_PROTECTED_MODULES } from "@/constants/founderProtectedModules";
import { RISK_COLORS } from "@/constants/founderPermissionLevels";
import { ArrowRight } from "lucide-react";

export function FounderSystemMap() {
  return (
    <Card className="aether-card-elevated p-4">
      <h3 className="font-display text-lg mb-3">受保护模块快速入口</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {FOUNDER_PROTECTED_MODULES.filter((m) => m.route).map((m) => (
          <Link
            key={m.id}
            to={m.route!}
            className="group flex items-start justify-between gap-2 p-3 rounded border border-border hover:border-primary/50 hover:bg-primary/5 transition"
          >
            <div className="min-w-0">
              <div className="text-sm truncate">{m.title}</div>
              <div className="text-[10px] text-muted-foreground truncate">{m.en}</div>
              <div className="text-[10px] text-muted-foreground/70 mt-1 truncate">{m.description}</div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Badge variant="outline" className={`text-[10px] ${RISK_COLORS[m.riskLevel]}`}>
                {m.riskLevel}
              </Badge>
              <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
