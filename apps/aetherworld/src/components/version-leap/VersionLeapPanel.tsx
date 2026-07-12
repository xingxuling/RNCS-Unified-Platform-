import { buildVersionLeapBundle } from "@/lib/version-leap/versionLeapEngine";
import { VersionImpactCard } from "./VersionImpactCard";
import { VersionLeapScoreCard } from "./VersionLeapScoreCard";
import { VersionTypeClassifierPanel } from "./VersionTypeClassifierPanel";
import { VersionNumberAdvisorPanel } from "./VersionNumberAdvisorPanel";
import { ReleaseNotePreview } from "./ReleaseNotePreview";
import { ReleaseReadinessPanel } from "./ReleaseReadinessPanel";
import { MigrationPlanPanel } from "./MigrationPlanPanel";
import { RollbackPlanPanel } from "./RollbackPlanPanel";
import { VersionDependencyGraphPanel } from "./VersionDependencyGraphPanel";
import { VersionAuditPanel } from "./VersionAuditPanel";
import { VersionExportPanel } from "./VersionExportPanel";

export function VersionLeapPanel() {
  const b = buildVersionLeapBundle("internal");
  return (
    <div className="space-y-6">
      <section className="border border-border/40 rounded-md p-4 bg-muted/10">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-xs text-muted-foreground">当前版本</span>
          <span className="font-mono text-lg">{b.currentVersion}</span>
          <span className="text-sm">{b.currentReleaseName}</span>
          <span className="text-xs text-muted-foreground">通道 {b.currentChannel} · 状态 {b.currentStatus}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {b.changeTypes.map((c) => <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{c}</span>)}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-2">影响范围</h2>
        <VersionImpactCard breakdown={b.impact} />
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section><h2 className="text-sm font-semibold mb-2">跃迁评分</h2><VersionLeapScoreCard score={b.score} /></section>
        <section><h2 className="text-sm font-semibold mb-2">版本号建议</h2><VersionNumberAdvisorPanel suggestion={b.suggestion} /></section>
      </div>

      <section>
        <h2 className="text-sm font-semibold mb-2">版本分类</h2>
        <VersionTypeClassifierPanel classification={b.classification} />
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-2">发布就绪</h2>
        <ReleaseReadinessPanel readiness={b.readiness} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ReleaseNotePreview note={b.publicNote} label="Public Release Note" />
        <ReleaseNotePreview note={b.founderNote} label="Founder Release Note" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section><h2 className="text-sm font-semibold mb-2">迁移计划</h2><MigrationPlanPanel plan={b.migration} /></section>
        <section><h2 className="text-sm font-semibold mb-2">回滚计划</h2><RollbackPlanPanel plan={b.rollback} /></section>
      </div>

      <section>
        <h2 className="text-sm font-semibold mb-2">版本依赖图</h2>
        <VersionDependencyGraphPanel />
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-2">版本审计</h2>
        <VersionAuditPanel audit={b.audit} />
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-2">导出</h2>
        <VersionExportPanel note={b.founderNote} />
      </section>
    </div>
  );
}
