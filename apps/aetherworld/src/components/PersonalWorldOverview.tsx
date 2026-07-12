import type { PersonalWorldResult } from "@/lib/personalWorldCalculus";
import { WorldSeedPanel } from "./WorldSeedPanel";
import { WorldArchetypeCard } from "./WorldArchetypeCard";
import { WorldRuleMap } from "./WorldRuleMap";
import { WorldZoneGrid } from "./WorldZoneGrid";
import { WorldEventMap as WorldEventMapView } from "./WorldEventMap";
import { WorldNarrativeReport } from "./WorldNarrativeReport";
import { WorldExportPanel } from "./WorldExportPanel";
import { WorldGenerationSafetyNote } from "./WorldGenerationSafetyNote";

export function PersonalWorldOverview({ result, modeName, privacyNote }:
  { result: PersonalWorldResult; modeName: string; privacyNote?: string }) {
  return (
    <div className="space-y-6">
      <WorldGenerationSafetyNote mode={modeName} privacyNote={privacyNote} />

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WorldArchetypeCard archetype={result.worldArchetype} />
        </div>
        <div className="space-y-6">
          <WorldSeedPanel result={result} />
          <div className="aether-card p-5">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Your Role · 你的角色</div>
            <div className="font-display text-lg gold-text mt-1">{result.userRole.userFriendlyName}</div>
            <p className="text-sm text-foreground/90 mt-2 leading-relaxed">{result.userRole.description}</p>
            <div className="mt-3 text-[11px] text-muted-foreground">
              <span className="text-primary/80">建议：</span>{result.userRole.actionAdvice}
            </div>
          </div>
        </div>
      </section>

      <WorldNarrativeReport result={result} />
      <WorldRuleMap rules={result.worldRules} />
      <WorldZoneGrid zones={result.worldZones} />
      <WorldEventMapView map={result.eventMap} />
      <WorldExportPanel result={result} />
    </div>
  );
}
