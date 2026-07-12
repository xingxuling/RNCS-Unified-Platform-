import { listWebCapabilityModels, getWebCapabilityRegistrySummary } from "@/lib/web-capability/webCapabilityRegistry";
import { WebCapabilityModelCard } from "./WebCapabilityModelCard";

export function WebCapabilityRegistryPanel() {
  const models = listWebCapabilityModels();
  const summary = getWebCapabilityRegistrySummary();
  return (
    <section className="space-y-3">
      <header className="flex items-baseline gap-3">
        <h2 className="text-base font-semibold">能力模型注册表</h2>
        <span className="text-xs text-muted-foreground">
          共 {summary.totalCapabilities} 个 · 活跃 {summary.activeCapabilities} · 草案 {summary.draftCapabilities}
        </span>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {models.map((m) => <WebCapabilityModelCard key={m.capabilityId} model={m} />)}
      </div>
    </section>
  );
}
