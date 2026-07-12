import type { VersionClassification } from "@/lib/version-leap/versionTypeClassifier";

function Row({ label, value }: { label: string; value: string | boolean }) {
  const display = typeof value === "boolean" ? (value ? "是" : "否") : value;
  return (
    <div className="flex items-center justify-between text-xs border-b border-border/30 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{display}</span>
    </div>
  );
}

export function VersionTypeClassifierPanel({ classification }: { classification: VersionClassification }) {
  return (
    <div className="border border-border/40 rounded-md p-4 bg-muted/10">
      <Row label="推荐等级" value={classification.recommendedLevel} />
      <Row label="发布类型" value={classification.releaseType} />
      <Row label="面向用户" value={classification.userFacing} />
      <Row label="需要迁移" value={classification.requiresMigration} />
      <Row label="需要文档更新" value={classification.requiresDocsUpdate} />
      <Row label="需要文案更新" value={classification.requiresTextUpdate} />
      <Row label="需要 QA" value={classification.requiresQA} />
      <Row label="需要 Recalculation" value={classification.requiresRecalculation} />
      <Row label="需要宪法审查" value={classification.requiresConstitutionCheck} />
      <Row label="需要 Founder 审批" value={classification.requiresFounderApproval} />
    </div>
  );
}
