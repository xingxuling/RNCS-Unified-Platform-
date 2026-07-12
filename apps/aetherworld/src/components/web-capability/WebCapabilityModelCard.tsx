import type { WebCapabilityModel } from "@/lib/web-capability/aetherWebCapabilityModels";
import { Link } from "@tanstack/react-router";

export function WebCapabilityModelCard({ model }: { model: WebCapabilityModel }) {
  return (
    <Link
      to="/web-capability-entry"
      search={{ id: model.capabilityId }}
      className="block rounded-lg border bg-card p-4 hover:border-primary/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">{model.name} · {model.chineseName}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{model.domain} · v{model.version}</div>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
          model.status === "ACTIVE" ? "border-emerald-500/40 text-emerald-600" : "border-amber-500/40 text-amber-600"
        }`}>{model.status}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{model.description}</p>
      <div className="text-[10px] text-muted-foreground mt-3">
        输出：{model.outputTypes.slice(0, 3).join(" · ")}{model.outputTypes.length > 3 ? " …" : ""}
      </div>
    </Link>
  );
}
