import { REALITY_SCIENCE_DOMAINS } from "@/constants/realityScienceDomains";
import { RealityScienceDomainCard } from "./RealityScienceDomainCard";
import { CreationRealityBoundaryNote } from "./CreationRealityBoundaryNote";
import { getRealityScienceUniverse } from "@/lib/realityScienceConstantsEngine";

export function RealityScienceUniversePanel() {
  const snap = getRealityScienceUniverse();
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Phase {snap.phase} · {snap.version}</div>
        <h1 className="text-2xl md:text-3xl font-display gold-text">现实科学宇宙常数</h1>
        <p className="text-sm text-muted-foreground max-w-3xl">
          10 大常数域，共 {snap.totalConstants} 个数字化现实科学常数。它们用于把外部世界的可行性、阻力、节律和审美抽象成可调用结构。
        </p>
      </header>
      <CreationRealityBoundaryNote />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REALITY_SCIENCE_DOMAINS.map(d => <RealityScienceDomainCard key={d.id} domainId={d.id} />)}
      </div>
    </div>
  );
}
